import { Component, Entity, IComponentChange, IComponentObject, IWorldConfig, World } from "ape-ecs";
import TurnStart from "./systems/turn-start";
import CHARACTERS from "./data/characters";
import WEAPONS from "./data/weapons";
import GameState from "./systems/state";
import * as fs from "fs";
import * as path from "path";
import getLv40Stats from "./systems/unit-stats";
import PASSIVES from "./data/passives";
import MovementTypes from "./data/movement-types";
import CombatSystem from "./systems/combat";
import SkillInteractionSystem from "./systems/skill-interaction";
import Teams from "./data/teams";
import MovementSystem from "./systems/movement";
import tileBitmasks from "./data/tile-bitmasks";
import TileBitshifts from "./data/tile-bitshifts";
import { Stat } from "./interfaces/types";
import getAllies from "./utils/get-allies";
import AfterCombatSystem from "./systems/after-combat";
import { NEGATIVE_STATUSES, STATUSES } from "./statuses";
import checkBattleEffectiveness from "./systems/effectiveness";
import getEnemies from "./utils/get-enemies";
import ASSISTS from "./data/assists";
import SPECIALS from "./data/specials";
import collectCombatMods from "./systems/collect-combat-mods";
import collectMapMods from "./systems/collect-map-mods";
import KillSystem from "./systems/kill";
import clearTile from "./systems/clear-tile";
// import shortid from "shortid";
import AssistSystem from "./systems/assist";
import getDistance from "./systems/get-distance";

/**
 * TODO:
 * implement basic combat preview
 * find a way to drop the js files
 */

const COMPONENTS_DIRECTORY = fs.readdirSync(path.join(__dirname, "./components"));

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
    state: GameState = {
        teamIds: ["", ""],
        lastChangeSequence: [],
        /**
         * Map is stored in an 8x6 matrix of 16 bits for each cell (column x row, top-left is indexed at [1][1]).
         * This map is used to store basic information on the cell coordinates, what's the cell's type, does it have anything special
         * (trench, defensive tile) added. It acts as the source of truth in case any state or data conflict arises.
         */
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
        currentSide: "",
        turn: 1,
        skillMap: new Map(),
        occupiedTilesMap: new Map()
    };

    constructor(config: Partial<IWorldConfig> & { team1: string; team2: string }) {
        super(config);
        const COMPONENTS = COMPONENTS_DIRECTORY.map((componentFile) => {
            return require(path.join(__dirname, "./components", componentFile)).default;
        });
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
        this.registerSystem("before-combat", SkillInteractionSystem, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
        this.registerSystem("movement", MovementSystem, [this.state]);
        this.registerSystem("after-combat", AfterCombatSystem, [this.state]);
        this.registerSystem("kill", KillSystem, [this.state]);
        this.registerSystem("assist", AssistSystem, [this.state]);
    }

    switchSides() {
        const otherSide = this.state.currentSide === this.state.teamIds[0] ? this.state.teamIds[1] : this.state.teamIds[0];
        if (this.state.currentSide === this.state.teamIds[1]) {
            this.state.turn++;
        }
        this.state.currentSide = otherSide;
    }

    startTurn() {
        let changes: (IComponentChange & Partial<{ detailedComponent: IComponentObject }>)[] = [];
        this.runSystems("every-turn");
        this.systems.get("every-turn").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(system._stagedChanges);
        });

        const turnEvents = this.outputEngineActions(changes);
        const withTurnChange = [`turn ${this.state.currentSide} ${this.state.turn}`].concat(turnEvents);
        return withTurnChange;
    }

    private outputEngineActions(events: IComponentChange[]) {
        let actions: string[] = [];
        const statuses = events.filter((change) => change.type === "Status" && change.op === "add");

        const statusDealingMap: { [k: string]: { target: string, status: string }[] } = {};
        for (let status of statuses) {
            const comp = this.getComponent(status.component);
            if (!statusDealingMap[comp.source.id]) statusDealingMap[comp.source.id] = [];
            statusDealingMap[comp.source.id].push({ target: comp.entity.id, status: comp.value });
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
                const comp = this.getComponent(damageAction.component).getObject(false);
                return `attack ${comp.attacker.entity.id} ${comp.attacker.hp} ${comp.attacker.specialCooldown} ${+comp.attacker.triggerSpecial} ${comp.target.damage} ${comp.attacker.heal} ${comp.target.entity.id} ${comp.target.hp} ${comp.target.specialCooldown} ${+comp.target.triggerSpecial} ${comp.target.damage} ${comp.target.heal}`;
            }).join("|");

            actions.push(attackActions);
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

    runCombat(attackerId: string, movementCoordinates: { x: number, y: number }, targetCoordinates: { x: number, y: number }, path: { x: number, y: number }[]) {
        const attacker = this.getEntity(attackerId);
        const range = attacker.getOne("Weapon").range;
        const targetTile = this.state.map[targetCoordinates.y][targetCoordinates.x];
        const defender = this.state.occupiedTilesMap.get(targetTile);
        const bestTile = path.find((tile) => getDistance(tile, targetCoordinates) === range);
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
        this.runSystems("combat");
        this.runSystems("kill");
        this.runSystems("after-combat");

        this.systems.get("before-combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        this.systems.get("combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        this.systems.get("after-combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        this.systems.get("kill").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        this.systems.get("after-combat").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(this.outputEngineActions(system._stagedChanges));
        });

        if (!attacker.destroyed) {
            attacker.removeComponent(b1);
            attacker.removeComponent(i1);
            changes = changes.concat(this.endAction(attacker.id));
        }

        if (!defender.destroyed) {
            defender.removeComponent(b2);
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
        entity.getComponents("TargetableTile").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("Obstruct").forEach((t) => { if (t) entity.removeComponent(t); });
        entity.getComponents("AssistTile").forEach((t) => { if (t) entity.removeComponent(t); });
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
                // if (systemTag === "combat") { console.log({ change }) };
                this.undoComponentChange(change);
            }
        });
    }

    previewUnitMovement(id: string, candidateTile: { x: number, y: number }) {
        const entity = this.getEntity(id);
        const currentPosition = entity.getOne("Position");
        if (currentPosition.x === candidateTile.x && currentPosition.y === candidateTile.y) {
            return false;
        }
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
        const newMapTile = this.state.map[newTile.y][newTile.x];
        const unit = this.getEntity(id);
        const positionComponent = unit.getOne("Position");
        const { x, y } = positionComponent;
        const { bitfield } = unit.getOne("Side");
        const mapTile = this.state.map[y][x];
        this.state.occupiedTilesMap.delete(mapTile);
        this.state.occupiedTilesMap.set(newMapTile, unit);
        clearTile(mapTile);
        newMapTile[0] |= bitfield;
        positionComponent.update(newTile);

        const mapDebuffs = Array.from(unit.getComponents("MapDebuff"));
        mapDebuffs.forEach((comp) => {
            unit.removeComponent(comp);
        });

        unit.tags.forEach((tag) => {
            if (NEGATIVE_STATUSES.includes(tag as typeof NEGATIVE_STATUSES[number])) {
                unit.removeTag(tag);
            }
        });

        const change = [`move ${id} ${positionComponent.x} ${positionComponent.y}`];

        if (endAction) {
            const endActionChanges = this.endAction(id);
            return change.concat(endActionChanges);
        }

        return change;
    };

    runAssist(source: string, target: string, actionCoordinates: { x: number, y: number }) {
        let changes = this.moveUnit(source, actionCoordinates, true);

        const assistSource = this.getEntity(source);
        if (!assistSource.has("Assist")) {
            // shouldn't be here
            return null;
        } else {
            const assistTarget = this.getEntity(target);
            const c1 = assistSource.addComponent({
                type: "Assisting"
            });

            const c2 = assistTarget.addComponent({
                type: "Assisting"
            });

            this.runSystems("assist");

            this.systems.get("assist").forEach((system) => {
                // @ts-ignore
                changes = changes.concat(this.outputEngineActions(system._stagedChanges));
            });

            assistSource.removeComponent(c1);
            assistTarget.removeComponent(c2);
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
            team.forEach((hero) => hero.removeComponent(hero.getOne("FinishedAction")));
            this.switchSides();
            const turnChanges = this.startTurn();
            changes = changes.concat(turnChanges);
        }

        return changes;
    }

    generateMap() {
        // const randomMapIndex = (1 + Math.floor(Math.random() * 90)).toString().padStart(4, "0");
        const randomMapIndex = "0011";
        console.log({ randomMapIndex });
        const mapId = `Z${randomMapIndex}`;
        this.state.mapId = mapId;
        this.state.topology = require(`../maps/${mapId}.json`);
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

    previewAttack(attackerId: string, targetCoordinates: { x: number, y: number }, temporaryCoordinates: { x: number, y: number }) {
        const mapTile = this.state.map[targetCoordinates.y][targetCoordinates.x];
        const attacker = this.getEntity(attackerId);
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
            ...temporaryCoordinates
        });
        this.runSystems("before-combat");
        this.runSystems("combat");

        attacker.removeComponent(b1);
        defender.removeComponent(b2);
        attacker.removeComponent(i1);
        const producedPreview = this.produceCombatPreview(attacker, defender);

        this.undoSystemChanges("before-combat");
        this.undoSystemChanges("combat");

        attacker.removeComponent(tempPos);

        return producedPreview;
    }

    produceCombatPreview(attacker: Entity, defender: Entity) {
        const attackerCombatBuffs = collectCombatMods(attacker);
        const defenderCombatBuffs = collectCombatMods(defender);

        attacker.removeComponent("Battling");
        defender.removeComponent("Battling");

        const attackerDamage = attacker.getComponents("DealDamage");
        const defenderDamage = defender.getComponents("DealDamage");

        let totalAttackerDamage = 0;
        let attackerDamagePerTurn = 0;
        let attackerTurns = 0;
        const attackerEffectiveness = checkBattleEffectiveness(attacker, defender);
        attackerDamage.forEach((comp) => {
            attackerTurns++;
            if (!comp.special) {
                attackerDamagePerTurn = comp.target.damage;
            }
            totalAttackerDamage += comp.target.damage;
        });

        let totalDefenderDamage = 0;
        let defenderDamagePerTurn = 0;
        let defenderTurns = 0;
        const defenderEffectiveness = checkBattleEffectiveness(defender, attacker);
        defenderDamage.forEach((comp) => {
            defenderTurns++;
            if (!comp.special) {
                defenderDamagePerTurn = comp.target.damage;
            }
            totalDefenderDamage += comp.target.damage;
        });

        const attackerNewHP = Math.max(0, attacker.getOne("Stats").hp - totalDefenderDamage);
        const defenderNewHP = Math.max(0, defender.getOne("Stats").hp - totalAttackerDamage);

        const attackerDamageData = {
            previousHP: attacker.getOne("Stats").hp,
            newHP: attackerNewHP,
            damagePerTurn: attackerDamagePerTurn,
            turns: attackerTurns,
            effectiveness: attackerEffectiveness,
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
            }
        };
    }

    createHero(member: HeroData, team: string, teamIndex: number) {
        const dexData = CHARACTERS[member.name];
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

        if (mapCell & tileBitmasks.occupation) {
            throw new Error("Tile is already occupied");
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

        const lv40Stats = getLv40Stats(stats, growthRates, rarity, hero.getOne("Boon")?.value, hero.getOne("Bane")?.value, merges, hero.getOne("Name").value);

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
        if (!targetEntity) return;

        const targetComponent = this.getComponent(change.component);
        switch (change.op) {
            case "add": {
                if (targetEntity) {
                    targetEntity.removeComponent(targetComponent);
                }
            }
                break;
            case "remove": {
                const component = this.getComponent(change.component);
                const { type, ...properties } = component;
                targetEntity.addComponent({
                    type,
                    ...properties
                });
            }
        }
    }
};

export default GameWorld;
