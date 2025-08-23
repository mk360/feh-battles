import { Component, Entity, IComponentChange, IComponentObject, IWorldConfig, World } from "ape-ecs";
import * as fs from "fs";
import * as path from "path";
import shortid from "shortid";
import ASSISTS from "./data/assists";
import CHARACTERS from "./data/characters";
import MovementTypes from "./data/movement-types";
import PASSIVES from "./data/passives";
import SPECIALS from "./data/specials";
import Teams from "./data/teams";
import tileBitmasks from "./data/tile-bitmasks";
import TileBitshifts from "./data/tile-bitshifts";
import WEAPONS from "./data/weapons";
import Debugger from "./debugger";
import { Stat } from "./interfaces/types";
import movesetManager from "./moveset-manager";
import { NEGATIVE_STATUSES, POSITIVE_STATUSES, STATUSES } from "./statuses";
import AfterCombatSystem from "./systems/after-combat";
import { removeStatuses } from "./systems/apply-map-effect";
import AssistSystem from "./systems/assist";
import BeforeCombat from "./systems/before-combat";
import collectCombatMods from "./systems/collect-combat-mods";
import collectMapMods from "./systems/collect-map-mods";
import CombatSystem from "./systems/combat";
import checkBattleEffectiveness from "./systems/effectiveness";
import getDistance from "./systems/get-distance";
import KillSystem from "./systems/kill";
import AfterAssist from "./systems/mechanics/after-assist";
import AoESystem from "./systems/mechanics/aoe";
import HPModSystem from "./systems/mechanics/hp-mod";
import MoveSystem from "./systems/mechanics/move";
import SpecialCooldownSystem from "./systems/mechanics/special-cooldown";
import MovementSystem from "./systems/movement";
import SkillInteractionSystem from "./systems/skill-interaction";
import GameState from "./systems/state";
import TurnStart from "./systems/turn-start";
import getLv40Stats from "./systems/unit-stats";
import getAllies from "./utils/get-allies";
import getEnemies from "./utils/get-enemies";
import validator from "./validator";

/**
 * TODO:
 * find a way to drop the js files
 */

const COMPONENTS = fs.readdirSync(path.join(__dirname, "./components")).map((componentFile) => {
    return require(path.join(__dirname, "./components", componentFile)).default;
});;

interface HeroData {
    name: string;
    rarity: number;
    weapon: string;
    skills: {
        assist: string;
        special: string;
        A: string;
        B: string;
        C: string;
        S: string;
    };
    merges?: number;
    boon?: Stat;
    bane?: Stat;
    allySupport?: {
        hero: string;
        level: "S" | "A" | "B" | "C";
    }
}

interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}

class GameWorld extends World {
    static validator = validator;
    static movesets = movesetManager;
    debugger: Debugger;
    id = shortid();
    state: GameState = {
        teamIds: ["", ""],
        lastChangeSequence: [],
        map: {
            1: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            2: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            3: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            4: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            5: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            6: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            7: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
            8: [null, new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1), new Uint16Array(1)],
        },
        mapId: "",
        topology: {
            tileData: [],
            spawnLocations: {}
        },
        teams: {},
        teamsByMovementTypes: {},
        teamsByWeaponTypes: {},
        requestedEnemyRange: [false, false],
        currentSide: "",
        turn: 1,
        skillMap: new Map(),
        occupiedTilesMap: new Map()
    };

    constructor(config: Partial<IWorldConfig> & { team1: string; team2: string }) {
        super(config);
        this.state.teamIds = [config.team1, config.team2];
        for (let component of COMPONENTS) {
            this.registerComponent(component);
        }
        this.state.currentSide = this.state.teamIds[0];
        for (let id of this.state.teamIds) {
            this.state.teamsByWeaponTypes[id] = {};
            this.state.teamsByMovementTypes[id] = {};
            this.state.teams[id] = new Set();
        }
        this.state.topology.spawnLocations = {
            [config.team1]: [],
            [config.team2]: [],
        };
        this.registerTags(...STATUSES);
        this.registerSystem("every-turn", TurnStart, [this.state]);
        this.registerSystem("before-combat", BeforeCombat, [this.state]);
        this.registerSystem("before-combat", SkillInteractionSystem, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
        this.registerSystem("movement", MovementSystem, [this.state]);
        this.registerSystem("move", MoveSystem, [this.state]);
        this.registerSystem("kill", KillSystem, [this.state]);
        this.registerSystem("aoe", AoESystem, [this.state]);
        this.registerSystem("hp-mod", HPModSystem);
        this.registerSystem("after-combat", AfterCombatSystem, [this.state]);
        this.registerSystem("after-assist", AfterAssist, [this.state]);
        this.registerSystem("assist", AssistSystem, [this.state]);
        this.registerSystem("special-cooldown", SpecialCooldownSystem);
        if (process.env.DEBUG === "1") {
            this.debugger = new Debugger(this);
        }
    }

    switchSides() {
        const otherSide = this.state.currentSide === this.state.teamIds[0] ? this.state.teamIds[1] : this.state.teamIds[0];
        if (this.state.currentSide === this.state.teamIds[1]) {
            this.state.turn++;
        }
        this.state.currentSide = otherSide;
    }

    startTurn() {
        const team = this.state.teams[this.state.currentSide];
        team.forEach((hero) => {
            for (let status of POSITIVE_STATUSES) {
                removeStatuses(hero, status);
            }
            hero.removeComponent(hero.getOne("FinishedAction"));
        });
        let changes: (IComponentChange & Partial<{ detailedComponent: IComponentObject }>)[] = [];
        this.runSystems("every-turn");
        this.systems.get("every-turn").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(system._stagedChanges);
        });

        const turnEvents = this.outputEngineActions(changes);
        const withTurnChange = [`turn ${this.state.currentSide} ${this.state.turn}`].concat(turnEvents);
        this.switchSides();
        this.state.lastChangeSequence = withTurnChange;
        return withTurnChange;
    }

    private outputEngineActions(events: IComponentChange[]) {
        let actions: string[] = [];

        const statusDealingMap: { [k: string]: { target: string, status: string }[] } = {};

        const statuses = events.filter((change) => change.type === "Status" && change.op === "add" && !!this.getComponent(change.component));

        for (let status of statuses) {
            const comp = this.getComponent(status.component);
            const source = comp.source.id;
            if (!statusDealingMap[source]) statusDealingMap[source] = [];
            statusDealingMap[source].push({ target: comp.entity.id, status: comp.value });
        }

        const line = Object.keys(statusDealingMap).map((dealer) => `trigger ${dealer}`).join(",");
        if (line.length) {
            actions.push(line);
        }

        const appliedStatuses: string[] = [];

        for (let dealer in statusDealingMap) {
            const effect = statusDealingMap[dealer];
            const line = effect.map((status) => `${status.status} ${status.target}`).join(",");
            appliedStatuses.push(line);
        }

        if (appliedStatuses.length) {
            actions = actions.concat(appliedStatuses.join(","));
        }

        const moveActions = events.filter((change) => change.type === "Move" && change.op === "add");
        if (moveActions.length) {
            actions.push(moveActions.map((action) => {
                const component = this.getComponent(action.component);
                return `move ${action.entity} ${component.x} ${component.y}`;
            }).join(","));
        }

        const dealDamageActions = events.filter((change) => change.type === "DealDamage" && change.op === "add");
        if (dealDamageActions.length) {
            const attackActions = dealDamageActions.map((damageAction) => {
                const comp = this.getComponent(damageAction.component);
                const parsed = comp.getObject(false);
                return `attack ${parsed.attacker.entity.id} ${parsed.attacker.hp} ${parsed.attacker.specialCooldown} ${parsed.attacker.triggerSpecial} ${parsed.attacker.damage} ${parsed.attacker.heal} ${parsed.target.entity.id} ${parsed.target.hp} ${parsed.target.specialCooldown} ${parsed.target.triggerSpecial} ${parsed.target.damage} ${parsed.target.heal}`;
            }).join("|");

            actions.push(attackActions);
        }

        const aoeDamage = events.filter(({ type }) => {
            return type === "AoEDamage";
        });

        const heal = events.filter(({ type, component }) => type === "Heal" && this.getComponent(component));

        const aoeDamageStrings = aoeDamage.concat(heal).map((change) => {
            const detailedComponent = this.getComponent(change.component);
            if (change.type === "AoEDamage") {
                return `map-damage ${detailedComponent.entity.id} ${detailedComponent.value} ${detailedComponent.remainingHP}`;
            }

            return `heal ${detailedComponent.entity.id} ${detailedComponent.value} ${detailedComponent.newHP}`;
        }).join("|");

        if (aoeDamageStrings) {
            actions.push(aoeDamageStrings);
        }

        const killAction = events.filter((change) => change.type === "Kill" && change.op === "add");

        actions = actions.concat(killAction.map((kill) => {
            return `kill ${kill.entity}`;
        }));

        return actions;
    };

    getUnitMapStats(id: string) {
        const entity = this.getEntity(id);
        const mapMods = collectMapMods(entity);

        return mapMods;
    }

    outputBeforeCombatActions(changes: IComponentChange[]) {
        const actions: string[] = [];
        const aoeDamage = changes.filter(({ type }) => {
            return type === "AoEDamage";
        });

        const heal = changes.filter(({ type, component }) => type === "Heal" && this.getEntity(component));

        const aoeDamageStrings = aoeDamage.concat(heal).map((change) => {
            const detailedComponent = this.getComponent(change.component);
            if (change.type === "AoEDamage") {
                return `map-damage ${detailedComponent.entity.id} ${detailedComponent.value} ${detailedComponent.remainingHP}`;
            }

            return `heal ${detailedComponent.entity.id} ${detailedComponent.value} ${detailedComponent.newHP}`;
        }).join("|");

        if (aoeDamageStrings) {
            actions.push(aoeDamageStrings);
        }

        return actions;
    }

    getEnemyRange(sideId: string, state: boolean) {
        const teamIndex = this.state.teamIds.indexOf(sideId);
        this.state.requestedEnemyRange[teamIndex] = state;
        const allTiles = new Set<number>();
        if (state) {
            const otherTeamId = this.state.teamIds.indexOf(sideId) === 0 ? this.state.teamIds[1] : this.state.teamIds[0];
            const teamMembers = this.state.teams[otherTeamId];
            teamMembers.forEach((member) => {
                const comp = member.addComponent({
                    type: "Movable"
                });
                member.getComponents("MovementTile").forEach((t) => { if (t) member.removeComponent(t); });
                member.getComponents("AttackTile").forEach((t) => { if (t) member.removeComponent(t); });
                member.getComponents("WarpTile").forEach((t) => { if (t) member.removeComponent(t); });
                member.getComponents("AssistTile").forEach((t) => { if (t) member.removeComponent(t); });
                member.getComponents("TargetableTile").forEach((t) => { if (t) member.removeComponent(t); });

                this.runSystems("movement");
                const movementTiles = member.getComponents("MovementTile");
                const attackTiles = member.getComponents("AttackTile");
                const warpTiles = member.getComponents("WarpTile");
                const targetableTiles = member.getComponents("TargetableTile");
                const assistTiles = member.getComponents("AssistTile");

                movementTiles.forEach((tile) => {
                    allTiles.add(tile.x * 10 + tile.y);
                });
                attackTiles.forEach((tile) => {
                    allTiles.add(tile.x * 10 + tile.y);
                });
                warpTiles.forEach((tile) => {
                    allTiles.add(tile.x * 10 + tile.y);
                });
                targetableTiles.forEach((tile) => {
                    allTiles.add(tile.x * 10 + tile.y);
                });

                movementTiles.forEach((t) => { if (t) member.removeComponent(t); });
                attackTiles.forEach((t) => { if (t) member.removeComponent(t); });
                warpTiles.forEach((t) => { if (t) member.removeComponent(t); });
                member.getComponents("Obstruct").forEach((t) => { if (t) member.removeComponent(t); });
                assistTiles.forEach((t) => { if (t) member.removeComponent(t); });
                targetableTiles.forEach((t) => { if (t) member.removeComponent(t); });
                member.removeComponent(comp);
            });
        }

        return allTiles;
    }

    runCombat(attackerId: string, movementCoordinates: { x: number, y: number }, targetCoordinates: { x: number, y: number }, path: { x: number, y: number }[]) {
        const attacker = this.getEntity(attackerId);
        const range = attacker.getOne("Weapon").range;
        const targetTile = this.state.map[targetCoordinates.y][targetCoordinates.x];
        const defender = this.state.occupiedTilesMap.get(targetTile);
        const bestTile = this.getActionableTile(attacker, path, range, targetCoordinates);
        const b1 = attacker.addComponent({
            type: "Battling"
        });
        const i1 = attacker.addComponent({
            type: "InitiateCombat"
        });
        const b2 = defender.addComponent({
            type: "Battling"
        });

        let changes: string[] = this.moveUnit(attackerId, bestTile, false);

        this.runSystems("before-combat");
        this.systems.get("before-combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputBeforeCombatActions(system._stagedChanges));
        });
        this.runSystems("combat");
        this.systems.get("combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });
        for (let status of NEGATIVE_STATUSES) {
            removeStatuses(attacker, status);
        }
        this.runSystems("after-combat");

        this.systems.get("after-combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        this.runSystems("kill");

        this.systems.get("kill").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        if (!attacker.destroyed) {
            attacker.removeComponent(b1);
            attacker.removeComponent(i1);

            if (attacker.getOne("Galeforce")) {
                attacker.removeComponent(attacker.getOne("Galeforce"));
                attacker.addComponent({
                    type: "Galeforced"
                });
            } else {
                changes = changes.concat(this.endAction(attacker.id));
            }

            attacker.getComponents("DealDamage").forEach((comp) => attacker.removeComponent(comp));
        }

        if (!defender.destroyed) {
            defender.removeComponent(b2);
            defender.getComponents("DealDamage").forEach((comp) => defender.removeComponent(comp));
        }

        return changes;
    }

    getUnitMovement(id: string) {
        const entity = this.getEntity(id);
        const comp = entity.addComponent({
            type: "Movable"
        });
        entity.getComponents("MovementTile").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("AttackTile").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("WarpTile").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("Obstruct").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("AssistTile").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("TargetableTile").forEach((t) => { if (t) entity.removeComponent(t); });

        this.runSystems("movement");
        const movementTiles = entity.getComponents("MovementTile");
        const attackTiles = entity.getComponents("AttackTile");
        const warpTiles = entity.getComponents("WarpTile");
        const targetableTiles = entity.getComponents("TargetableTile");
        const assistTiles = entity.getComponents("AssistTile");
        entity.removeComponent(comp);
        const enemies = getEnemies(this.state, entity);
        const effectivenessMap: {
            [k: string]: [boolean, boolean];
        } = {};

        for (let enemy of enemies) {
            const heroIsEffective = checkBattleEffectiveness(entity, enemy);
            const enemyIsEffective = checkBattleEffectiveness(enemy, entity);
            if (heroIsEffective || enemyIsEffective) {
                effectivenessMap[enemy.id] = [heroIsEffective, enemyIsEffective];
            }
        }

        return { movementTiles, attackTiles, warpTiles, targetableTiles, effectiveness: effectivenessMap, assistTiles };
    }

    private undoSystemChanges(systemTag: string) {
        this.systems.get(systemTag).forEach((sys) => {
            // @ts-ignore
            for (let change of sys._stagedChanges) {
                this.undoComponentChange(change);
            }
        });
    }

    private outputAssistActions(actions: IComponentChange[]) {
        let actionStrings: string[] = [];

        const refresh = actions.filter((action) => action.op === "delete" && action.type === "FinishedAction").map((action) => `refresh ${action.entity}`);

        if (refresh.length) {
            actionStrings = actionStrings.concat(refresh);
        }

        const swap = actions.filter((action) => action.type === "Swap") as (IComponentChange & { x: number; y: number; assistTarget: { x: number; y: number } })[];
        let assistString = "";
        if (swap.length === 1) {
            let en = this.getComponent(swap[0].component).getObject(false);
            var sourceCoords = en.x * 10 + en.y;
            var targetCoords = en.assistTarget.x * 10 + en.assistTarget.y;
            assistString = `assist-movement Swap ${swap[0].entity} ${en.assistTarget.entity.id} ${sourceCoords} ${targetCoords}`;
            actionStrings.push(assistString);
        }

        const reposition = actions.find((action) => action.type === "Reposition") as (IComponentChange & { targetEntity: string, x: number, y: number });

        if (reposition) {
            const cmp = this.getComponent(reposition.component);
            const sourcePosition = cmp.entity.getOne("Position");
            const sourceCoords = sourcePosition.x * 10 + sourcePosition.y;
            const targetCoords = cmp.x * 10 + cmp.y;
            assistString = `assist-movement Reposition ${cmp.entity.id} ${cmp.targetEntity.id} ${sourceCoords} ${targetCoords}`;
            actionStrings.push(assistString);
        }

        const pivot = actions.find((action) => action.type === "Pivot") as (IComponentChange & { x: number, y: number });

        if (pivot) {
            const cmp = this.getComponent(pivot.component);
            const targetCoords = cmp.x * 10 + cmp.y;
            assistString = `assist-movement Pivot ${cmp.entity.id} ${cmp.entity.id} ${targetCoords}`;
            actionStrings.push(assistString);
        }

        const shove = actions.find((action) => action.type === "Shove") as (IComponentChange & { x: number, y: number; target: Entity });

        if (shove) {
            const cmp = this.getComponent(shove.component);
            const targetCoords = cmp.x * 10 + cmp.y;
            const sourcePosition = cmp.entity.getOne("Position");
            const sourceCoords = sourcePosition.x * 10 + sourcePosition.y;
            assistString = `assist-movement Shove ${cmp.entity.id} ${cmp.target.id} ${sourceCoords} ${targetCoords}`;
            actionStrings.push(assistString);
        }

        const drawBack = actions.filter((action) => action.type === "DrawBack") as (IComponentChange & { x: number, y: number; })[];

        if (drawBack.length) {
            actionStrings.push(`assist-movement DrawBack ${drawBack.map((i) => {
                const cmp = this.getComponent(i.component);
                return `(${i.entity} ${cmp.oldX * 10 + cmp.oldY} ${cmp.x * 10 + cmp.y})`;
            }).join(" ")}`);
        }

        const statuses = actions.filter((change) => change.type === "Status" && change.op === "add");

        const statusDealingMap: { [k: string]: { target: string, status: string }[] } = {};

        for (let status of statuses) {
            const comp = this.getComponent(status.component);
            const source = comp.source.id;
            if (!statusDealingMap[source]) statusDealingMap[source] = [];
            statusDealingMap[source].push({ target: comp.entity.id, status: comp.value });
        }

        const line = Object.keys(statusDealingMap).map((dealer) => `trigger ${dealer}`).join(",");

        if (line.length) {
            actionStrings.push(line);
        }

        const appliedStatuses: string[] = [];

        for (let dealer in statusDealingMap) {
            const effect = statusDealingMap[dealer];
            const line = effect.map((status) => `${status.status} ${status.target}`).join(",");
            appliedStatuses.push(line);
        }

        if (appliedStatuses.length) {
            actionStrings = actionStrings.concat(appliedStatuses.join(","));
        }

        const healing = actions.filter((change) => change.type === "Heal" && change.op === "add" && !!this.getComponent(change.component));

        if (healing.length) {
            actionStrings = actionStrings.concat(healing.map((i) => {
                const comp = this.getComponent(i.component).getObject(false);
                return `healing ${comp.entity} ${comp.value} ${comp.newHP}`;
            }));
        }

        return actionStrings;
    }

    previewUnitMovement(id: string, candidateTile: { x: number, y: number }) {
        const entity = this.getEntity(id);
        const allyPositions = getAllies(this.state, entity).map((ally) => {
            const position = ally.getOne("Position");
            const { x, y } = position;
            return this.state.map[y][x];
        });
        const movementTiles = new Set([...entity.getComponents("MovementTile"), ...entity.getComponents("WarpTile")]);
        const foundTile = Array.from(movementTiles).find((t) => {
            const tilemap = this.state.map[t.y][t.x];
            if (allyPositions.includes(tilemap)) return false;
            return t.x === candidateTile.x && t.y === candidateTile.y
        });
        return !!foundTile;
    }

    moveUnit(id: string, newTile: { x: number, y: number }, endAction: boolean) {
        const unit = this.getEntity(id);
        unit.addComponent({
            type: "Move",
            x: newTile.x,
            y: newTile.y,
        });

        this.runSystems("move");

        const positionComponent = unit.getOne("Position");
        const change = [`move ${id} ${positionComponent.x} ${positionComponent.y}`];

        if (endAction) {
            const endActionChanges = this.endAction(id);
            return change.concat(endActionChanges);
        }

        unit.getComponents("MovementTile").forEach((tile) => {
            unit.removeComponent(tile);
        });

        unit.getComponents("AssistTile").forEach((tile) => {
            unit.removeComponent(tile);
        });

        unit.getComponents("AttackTile").forEach((tile) => {
            unit.removeComponent(tile);
        });

        unit.getComponents("TargetableTile").forEach((tile) => {
            unit.removeComponent(tile);
        });

        return change;
    };

    runAssist(source: string, target: { x: number; y: number }, actionCoordinates: { x: number, y: number }, path: string[]) {
        let changes: string[] = [];

        const assistSource = this.getEntity(source);
        if (!assistSource.getOne("Assist") || !this.previewUnitMovement(source, actionCoordinates)) {
            // shouldn't be here
            return null;
        } else {
            const targetTile = this.state.map[target.y][target.x];
            const assistTarget = this.state.occupiedTilesMap.get(targetTile);
            const c1 = assistSource.addComponent({
                type: "Assisting"
            });
            const temp1 = assistSource.addComponent({
                type: "TemporaryPosition",
                x: actionCoordinates.x,
                y: actionCoordinates.y
            })

            const c2 = assistTarget.addComponent({
                type: "Assisted"
            });

            changes = changes.concat(this.moveUnit(source, actionCoordinates, false));

            this.runSystems("assist");

            this.systems.get("assist").forEach((system) => {
                // @ts-ignore
                changes = changes.concat(this.outputAssistActions(system._stagedChanges));
            });

            // TODO : run a cleanup function that removes assist commands

            assistSource.removeComponent(c1);
            assistSource.removeComponent(temp1);
            assistTarget.removeComponent(c2);
        }

        changes = changes.concat(this.endAction(source));

        for (let status of NEGATIVE_STATUSES) {
            removeStatuses(assistSource, status);
        }

        return changes;
    }

    endAction(id: string) {
        let changes: string[] = [];

        const unit = this.getEntity(id);

        unit.addComponent({
            type: "FinishedAction"
        });

        changes.push(`finish ${id}`);

        const team = this.state.teams[unit.getOne("Side").value as "team1" | "team2"];
        const remainingUnits = Array.from(team).filter((e) => !e.getOne("FinishedAction"));

        if (remainingUnits.length === 0) {
            for (let unit of remainingUnits) {
                for (let status of NEGATIVE_STATUSES) {
                    removeStatuses(unit, status);
                }
            }
            const turnChanges = this.startTurn();
            changes = changes.concat(turnChanges);
        }

        return changes;
    }

    generateMap() {
        // const randomMapIndex = (1 + Math.floor(Math.random() * 90)).toString().padStart(4, "0");
        const randomMapIndex = "0011";
        // console.log({ randomMapIndex });
        const mapId = `Z${randomMapIndex}`;
        this.state.mapId = mapId;
        this.state.topology = JSON.parse(JSON.stringify(require(`../maps/${mapId}.json`)));
        // Each generated map binds this.state.topology to a new reference of the map. TODO find a better way to require a fresh copy of the map
        this.state.topology.spawnLocations[this.state.teamIds[0]] = this.state.topology.spawnLocations.team1;
        this.state.topology.spawnLocations[this.state.teamIds[1]] = this.state.topology.spawnLocations.team2;
        delete this.state.topology.spawnLocations.team1;
        delete this.state.topology.spawnLocations.team2;
        for (let y = 1; y <= this.state.topology.tileData.length; y++) {
            const line = this.state.topology.tileData[y - 1];
            for (let x = 0; x < line.length; x++) {
                const tile = line[x];
                let bitField = 0;
                const [tileType, ...addedCharacteristics] = tile.split("-");
                const uint16 = new Uint16Array(1);
                // initial 4 bits determine tile type
                bitField |= tileBitmasks.type[tileType as keyof typeof tileBitmasks.type];
                for (let addedCharacteristic of addedCharacteristics) {
                    if (addedCharacteristic === "trench") {
                        bitField |= 1 << TileBitshifts.trench;
                    }
                    if (addedCharacteristic === "defensive") {
                        bitField |= 1 << TileBitshifts.defensiveTile;
                    }
                }

                bitField |= ((y - 1) << TileBitshifts.y);
                bitField |= (x << TileBitshifts.x);
                uint16[0] = bitField;
                this.state.map[y][x + 1] = uint16;
            }
        }
    };

    previewAssist(sourceId: string, targetCoordinates: { x: number, y: number }, temporaryCoordinates: { x: number, y: number }) {
        const mapTile = this.state.map[targetCoordinates.y][targetCoordinates.x];
        const source = this.getEntity(sourceId);
        const assistSkill = source.getOne("Assist");

        const target = this.state.occupiedTilesMap.get(mapTile);
        const c1 = source.addComponent({
            type: "PreviewAssist",
        });
        const c2 = target.addComponent({
            type: "PreviewAssist"
        });

        this.runSystems("assist");

        const payload = {
            assisting: {
                id: source.id,
                previousHP: source.getOne("Stats").hp,
                expectedHP: source.getOne("PreviewHP").value,
            },
            assisted: {
                id: target.id,
                previousHP: target.getOne("Stats").hp,
                expectedHP: target.getOne("PreviewHP").value
            },
            assist: assistSkill.name,
        };

        this.undoSystemChanges("assist");

        source.removeComponent(c1);
        target.removeComponent(c2);

        return payload;
    }

    previewCombat(attackerId: string, targetCoordinates: { x: number, y: number }, temporaryCoordinates: { x: number, y: number }, path: { x: number, y: number }[]) {
        const attacker = this.getEntity(attackerId);
        const range = attacker.getOne("Weapon").range;
        const mapTile = this.state.map[targetCoordinates.y][targetCoordinates.x];
        const bestTile = this.getActionableTile(attacker, path, range, targetCoordinates);
        const defender = this.state.occupiedTilesMap.get(mapTile);
        const b1 = attacker.addComponent({
            type: "PreviewingBattle"
        });

        const i1 = attacker.addComponent({
            type: "InitiateCombat"
        });

        const b2 = defender.addComponent({
            type: "PreviewingBattle"
        });
        const tempPos = attacker.addComponent({
            type: "TemporaryPosition",
            ...bestTile
        });
        this.runSystems("before-combat");
        this.runSystems("combat");

        attacker.removeComponent(b1);
        attacker.removeComponent(i1);
        defender.removeComponent(b2);
        const producedPreview = this.produceCombatPreview(attacker, defender, bestTile);

        this.undoSystemChanges("before-combat");
        this.undoSystemChanges("combat");

        attacker.removeComponent(tempPos);

        return producedPreview;
    }

    produceCombatPreview(attacker: Entity, defender: Entity, bestTile: { x: number; y: number }) {
        const attackerCombatBuffs = collectCombatMods(attacker);
        const defenderCombatBuffs = collectCombatMods(defender);
        const aoeTargets = Array.from(this.getEntities("AoETarget")).map((ent) => ent.id);
        let totalAttackerDamage = 0;
        let attackerDamagePerTurn = 0;

        if (aoeTargets.includes(defender.id)) {
            totalAttackerDamage += defender.getOne("AoETarget").value;
        }

        const attackerDamage = attacker.getComponents("DealDamage");
        const defenderDamage = defender.getComponents("DealDamage");

        const attackerTurns = attackerDamage.size;
        const attackerEffectiveness = checkBattleEffectiveness(attacker, defender);

        attackerDamage.forEach((comp) => {
            if (attackerTurns === 1 || (!comp.special && attackerTurns > 1) || (comp.special && attackerTurns === 1)) {
                attackerDamagePerTurn = comp.attacker.damage;
            }
            totalAttackerDamage += comp.attacker.damage;
        });

        let totalDefenderDamage = 0;
        let defenderDamagePerTurn = 0;
        let defenderTurns = defenderDamage.size;
        const defenderEffectiveness = checkBattleEffectiveness(defender, attacker);
        defenderDamage.forEach((comp) => {
            if (defenderTurns === 1 || (!comp.special && defenderTurns > 1) || (comp.special && defenderTurns === 1)) {
                defenderDamagePerTurn = comp.attacker.damage;
            }
            totalDefenderDamage += comp.attacker.damage;
        });

        const attackerNewHP = Math.max(0, attacker.getOne("Stats").hp - totalDefenderDamage);
        const defenderNewHP = Math.max(0, defender.getOne("Stats").hp - totalAttackerDamage);

        const attackerDamageData = {
            previousHP: attacker.getOne("Stats").hp,
            newHP: attackerNewHP,
            damagePerTurn: attackerDamagePerTurn,
            turns: attackerTurns,
            effectiveness: attackerEffectiveness,
            beforeCombat: defender.getOne("AoETarget")?.value ?? 0
        };

        const defenderDamageData = {
            previousHP: defender.getOne("Stats").hp,
            newHP: defenderNewHP,
            damagePerTurn: defenderDamagePerTurn,
            turns: defenderTurns,
            effectiveness: defenderEffectiveness,
        };

        return {
            attacker: {
                id: attacker.id,
                combatBuffs: attackerCombatBuffs,
                ...attackerDamageData
            },
            defender: {
                id: defender.id,
                combatBuffs: defenderCombatBuffs,
                ...defenderDamageData
            },
            attackerTile: bestTile,
            aoeTargets
        };
    }

    createHero(member: HeroData, team: string, teamIndex: number) {
        const dexData = CHARACTERS[member.name];
        if (dexData) {
            try {
                const entity = this.createEntity({
                    components: [{
                        type: "Name",
                        value: member.name,
                        description: dexData.description
                    }]
                });

                if (member.bane && member.boon && member.bane !== member.boon) {
                    entity.addComponent({
                        type: "Bane",
                        value: member.bane
                    });
                    entity.addComponent({
                        type: "Boon",
                        value: member.boon
                    });
                }

                const components = this.createCharacterComponents(entity, team, member.rarity, member.merges);

                for (let component of components) {
                    entity.addComponent(component);
                }
                const tilePlacement = this.state.topology.spawnLocations[team][teamIndex - 1];
                const { x, y } = tilePlacement;

                entity.addComponent({
                    type: "Position",
                    ...tilePlacement
                });

                const mapCell = this.state.map[y][x];

                if (mapCell[0] & tileBitmasks.occupation) {
                    const occupied = this.state.occupiedTilesMap.get(mapCell);
                    if (!occupied) {
                        throw new Error("Tile is registered as occupied but nobody is on it. Did you manually assign an Entity's coordinates?");
                    } else {
                        throw new Error("Tile is already occupied by " + occupied.getOne("Name").value);
                    }
                }

                this.state.map[y][x][0] |= Teams[this.state.teamIds.indexOf(team)];

                this.state.occupiedTilesMap.set(this.state.map[y][x], entity);

                const entitySkillDict: { [k: string]: Set<Component> } = {};

                if (member.weapon) {
                    const skillData = WEAPONS[member.weapon];
                    const stats = entity.getOne("Stats");
                    stats.atk += skillData.might;

                    const weaponComponentData = {
                        type: "Skill",
                        description: skillData.description,
                        slot: "weapon",
                        name: member.weapon,
                        displayName: skillData.displayName,
                        might: skillData.might,
                    };

                    const weaponComponent = entity.addComponent(weaponComponentData);

                    for (let hook in skillData) {
                        const castHook = hook as keyof typeof skillData;
                        if (castHook === "onEquip") {
                            skillData.onEquip.call(weaponComponent);
                        } else if (typeof skillData[castHook] === "function") {
                            entitySkillDict[castHook] = entitySkillDict[castHook] || new Set();
                            entitySkillDict[castHook].add(weaponComponent);
                        }
                    }

                    if (skillData.effectiveAgainst) {
                        for (let effectiveness of skillData.effectiveAgainst) {
                            entity.addComponent({
                                type: "Effectiveness",
                                value: effectiveness
                            });
                        }
                    }

                    if (skillData.protects) {
                        for (let effectiveness of skillData.protects) {
                            entity.addComponent({
                                type: "Immunity",
                                value: effectiveness
                            });
                        }
                    }
                }

                if (member.skills.assist) {
                    const skillData = ASSISTS[member.skills.assist];
                    if (skillData) {
                        const assistComponent = {
                            type: "Assist",
                            description: skillData.description,
                            name: member.skills.assist,
                            range: skillData.range
                        };

                        entity.addComponent(assistComponent);

                        if (skillData.type.includes("refresh")) {
                            entity.addComponent({
                                type: "Refresher"
                            });
                        }
                    }
                }

                if (member.skills.special) {
                    const skillData = SPECIALS[member.skills.special];
                    if (skillData) {
                        const specialComponent = {
                            type: "Special",
                            description: skillData.description,
                            slot: "special",
                            name: member.skills.special,
                            baseCooldown: skillData.cooldown,
                            maxCooldown: skillData.cooldown,
                            cooldown: skillData.cooldown
                        };

                        const modifiedCooldown = entity.getOne("ModifySpecialCooldown");

                        if (modifiedCooldown) {
                            specialComponent.maxCooldown += modifiedCooldown.value;
                            specialComponent.cooldown += modifiedCooldown.value;
                            entity.removeComponent(modifiedCooldown);
                        }

                        entity.addComponent(specialComponent);
                    }
                }

                for (let skill in member.skills) {
                    const skillName = member.skills[skill];
                    const skillData = PASSIVES[skillName];
                    if (skillData) {
                        const skillComponent = {
                            type: "Skill",
                            description: skillData.description,
                            slot: skill,
                            name: skillName,
                        };

                        const internalComponent = entity.addComponent(skillComponent);

                        for (let hook in skillData) {
                            const castHook = hook as keyof typeof skillData;
                            if (castHook === "onEquip") {
                                skillData.onEquip.call(internalComponent);
                            } else if (typeof skillData[castHook] === "function") {
                                entitySkillDict[castHook] = entitySkillDict[castHook] || new Set();
                                entitySkillDict[castHook].add(internalComponent);
                            }
                        }

                        if (skillData.protects) {
                            for (let immunity of skillData.protects) {
                                entity.addComponent({
                                    type: "Immunity",
                                    value: immunity
                                });
                            }
                        }

                        if (skillData.effectiveAgainst) {
                            for (let effectiveness of skillData.effectiveAgainst) {
                                entity.addComponent({
                                    type: "Effectiveness",
                                    value: effectiveness
                                });
                            }
                        }
                    }
                }

                this.state.skillMap.set(entity, entitySkillDict);

                this.state.teams[team].add(entity);

                return entity;
            } catch (e) {
                console.log({ e });
                console.error(`Error creating the Hero ${member.name}`);
                throw e;
            }
        } else {
            throw new Error(`Character not found: "${member.name}"`);
        }
    }

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;
        for (let i = 0; i < team1.length; i++) {
            const member = team1[i];
            this.createHero(member, this.state.teamIds[0], i + 1);
        }

        for (let i = 0; i < team2.length; i++) {
            const member = team2[i];
            this.createHero(member, this.state.teamIds[1], i + 1);
        }
    }

    private createCharacterComponents(hero: Entity, team: string, rarity: number, merges: number): { type: string;[k: string]: any }[] {
        const { value: name } = hero.getOne("Name");
        const dexData = CHARACTERS[name];
        const { stats, growthRates } = dexData;
        if (!this.state.teamsByMovementTypes[team][dexData.movementType]) {
            this.state.teamsByMovementTypes[team][dexData.movementType] = 0;
        }

        this.state.teamsByMovementTypes[team][dexData.movementType]++;

        if (!this.state.teamsByWeaponTypes[team][dexData.weaponType]) {
            this.state.teamsByWeaponTypes[team][dexData.weaponType] = 0;
        }

        this.state.teamsByWeaponTypes[team][dexData.weaponType]++;

        const lv40Stats = getLv40Stats(stats, growthRates, rarity, hero.getOne("Boon")?.value, hero.getOne("Bane")?.value, merges);

        const components: { type: string;[k: string]: any }[] = [
            {
                type: "Weapon",
                weaponType: dexData.weaponType,
                color: dexData.color,
                range: ["sword", "lance", "axe", "beast", "breath"].includes(dexData.weaponType) ? 1 : 2,
                useMagic: ["tome", "breath", "staff"].includes(dexData.weaponType),
            },
            {
                type: "Stats",
                ...lv40Stats,
                maxHP: lv40Stats.hp
            },
            {
                type: "Side",
                value: team,
                bitfield: Teams[this.state.teamIds.indexOf(team)]
            },
            {
                type: "MovementType",
                value: dexData.movementType,
                ...MovementTypes[dexData.movementType]
            }
        ];

        if (merges) {
            components.push({
                type: "HeroMerge",
                value: merges
            });
        }

        return components;
    }

    private undoComponentChange(change: IComponentChange) {
        const targetEntity = this.getEntity(change.entity);
        const targetComponent = this.getComponent(change.component);
        if (!targetEntity || !targetComponent) return;

        switch (change.op) {
            case "add": {
                targetEntity.removeComponent(targetComponent);
            }
                break;
            case "remove": {
                const { type, ...properties } = targetComponent;
                targetEntity.addComponent({
                    type,
                    ...properties
                });
            }
        }
    }

    private getActionableTile(unit: Entity, path: { x: number; y: number }[], range: number, targetCoordinates: { x: number; y: number }) {
        let bestTile = path.reverse().find((tile) => getDistance(tile, targetCoordinates) === range);
        if (!bestTile) {
            const movementTiles = Array.from(unit.getComponents("MovementTile")).filter((tile) => getDistance(tile.getObject() as unknown as { x: number; y: number }, targetCoordinates) === range);
            bestTile = movementTiles[0].getObject(false) as unknown as { x: number; y: number };
        }

        return bestTile;
    }
};

export default GameWorld;
