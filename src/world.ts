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
import { STATUSES } from "./statuses";
import checkBattleEffectiveness from "./systems/effectiveness";
import getEnemies from "./utils/get-enemies";

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
    boon?: Stat;
    bane?: Stat;
}

interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}

class GameWorld extends World {
    state: GameState = {
        /**
         * Map is stored in an 8x6 matrix of 16 bits for each cell (column x row, top-left is indexed at [1][0]).
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
        topology: null,
        teams: {
            team1: new Set(),
            team2: new Set(),
        },
        teamsByMovementTypes: {
            team1: {},
            team2: {}
        },
        teamsByWeaponTypes: {
            team1: {},
            team2: {}
        },
        currentSide: "team1",
        turn: 1,
        skillMap: new Map(),
        occupiedTilesMap: new Map()
    };

    constructor(config?: IWorldConfig) {
        super(config);
        const COMPONENTS = COMPONENTS_DIRECTORY.map((componentFile) => {
            return require(path.join(__dirname, "./components", componentFile)).default;
        });
        for (let component of COMPONENTS) {
            this.registerComponent(component);
        }
        this.registerTags(...STATUSES);
        this.registerSystem("every-turn", TurnStart, [this.state]);
        this.registerSystem("combats", SkillInteractionSystem, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
        this.registerSystem("movement", MovementSystem, [this.state]);
        this.registerSystem("after-combat", AfterCombatSystem, [this.state]);
    }

    startTurn() {
        let changes: (IComponentChange & Partial<{ detailedComponent: IComponentObject }>)[] = [];
        this.runSystems("every-turn");
        this.systems.get("every-turn").forEach((system) => {
            // @ts-ignore
            changes = changes.concat(system._stagedChanges.map((op) => this.processOperation(op)));
        });

        return changes;
    }

    private processOperation(op: IComponentChange) {
        if (["update", "add"].includes(op.op)) {
            const { type, ...component } = this.getComponent(op.component).getObject(false);
            return {
                ...op,
                ...component
            };
        }

        return op;
    }

    getUnitMovement(id: string) {
        const entity = this.getEntity(id);
        const comp = entity.addComponent({
            type: "Movable"
        });
        entity.getComponents("MovementTile").forEach((t) => { if (t) entity.removeComponent(t) });
        entity.getComponents("AttackTile").forEach((t) => { if (t) entity.removeComponent(t) });
        entity.getComponents("WarpTile").forEach((t) => { if (t) entity.removeComponent(t) });
        entity.getComponents("TargetableTile").forEach((t) => { if (t) entity.removeComponent(t) });
        entity.getComponents("Obstruct").forEach((t) => { if (t) entity.removeComponent(t) });
        this.runSystems("movement");
        const movementTiles = entity.getComponents("MovementTile");
        const attackTiles = entity.getComponents("AttackTile");
        const warpTiles = entity.getComponents("WarpTile");
        const targetableTiles = entity.getComponents("TargetableTile");
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

        const targetableEnemies: string[] = [];
        targetableTiles.forEach(({ x, y }) => {
            const tile = this.state.map[y][x];
            const enemy = this.state.occupiedTilesMap.get(tile).id;
            targetableEnemies.push(enemy);
        });

        return { movementTiles, attackTiles, warpTiles, targetableTiles, effectiveness: effectivenessMap, targetableEnemies };
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

    moveUnit(id: string, newTile: { x: number, y: number }) {
        const newMapTile = this.state.map[newTile.y][newTile.x];
        const unit = this.getEntity(id);
        const positionComponent = unit.getOne("Position");
        const { x, y } = positionComponent;
        const { bitfield } = unit.getOne("Side");
        const mapTile = this.state.map[y][x];
        this.state.occupiedTilesMap.delete(mapTile);
        this.state.occupiedTilesMap.set(newMapTile, unit);
        const blankBitmap = new Uint16Array(1);
        blankBitmap[0] = -1;
        const bitArray = blankBitmap[0].toString(2).split("");
        bitArray[bitArray.length - TileBitshifts.occupation1 - 1] = "0";
        bitArray[bitArray.length - TileBitshifts.occupation2 - 1] = "0";
        const newBinaryMap = +`0b${bitArray.join("")}`;
        mapTile[0] &= newBinaryMap;
        newMapTile[0] |= bitfield;
        positionComponent.update(newTile);
        return positionComponent;
    }

    generateMap() {
        const randomMapIndex = (1 + Math.floor(Math.random() * 33)).toString().padStart(4, "0");
        const mapId = `Z${randomMapIndex}`;
        this.state.mapId = mapId;
        this.state.topology = require(`../maps/${mapId}.json`);
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

    createHero(member: HeroData, team: "team1" | "team2", teamIndex: number) {
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

        const components = this.createCharacterComponents(entity, team, member.rarity);

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

        this.state.map[y][x][0] |= Teams[team];

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

                this.state.skillMap.set(entity, entitySkillDict);

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

        this.state.teams[team].add(entity);

        return entity;
    }

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;

        for (let i = 0; i < team1.length; i++) {
            const member = team1[i];
            this.createHero(member, "team1", i + 1);
        }

        for (let i = 0; i < team2.length; i++) {
            const member = team2[i];
            this.createHero(member, "team2", i + 1);
        }
    }

    private createCharacterComponents(hero: Entity, team: "team1" | "team2", rarity: number): { type: string;[k: string]: any }[] {
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

        const lv40Stats = getLv40Stats(stats, growthRates, rarity, hero.getOne("Boon")?.value, hero.getOne("Bane")?.value);

        return [
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
                bitfield: Teams[team]
            },
            {
                type: "MovementType",
                value: dexData.movementType,
                ...MovementTypes[dexData.movementType]
            }
        ];
    }
};

export default GameWorld;
