import { Component, Entity, IWorldConfig, World } from "ape-ecs";
import Weapon from "./components/weapon";
import MapEffects from "./systems/map-effects";
import Stats from "./components/stats";
import CHARACTERS from "./data/characters";
import Side from "./components/side";
import Skill from "./components/skill";
import WEAPONS from "./data/weapons";
import GameState from "./systems/state";
import Position from "./components/position";
import Effectiveness from "./components/effectiveness";
import MovementType from "./components/movement-type";
import Immunity from "./components/immunity";
import Bane from "./components/bane";
import Boon from "./components/boon";
import { Stat } from "./interfaces/types";
import getLv40Stats from "./systems/unit-stats";
import WarpableTile from "./components/warpable-tile";
import WalkableTile from "./components/walkable-tile";
import PASSIVES from "./data/passives";
import MapDebuff from "./components/map-debuff";
import MovementTypes from "./data/movement-types";
import Name from "./components/name";
import CombatSystem from "./systems/combat";
import Battling from "./components/battling";
import PreventEnemyAlliesInteraction from "./components/prevent-enemy-allies-interaction";
import CombatBuff from "./components/combat-buff";
import Counterattack from "./components/counterattack";
import MapBuff from "./components/map-buff";
import NeutralizeMapBuffs from "./components/neutralize-map-buffs";
import TargetLowestDefense from "./components/target-lowest-defense";
import AccelerateSpecial from "./components/accelerate-special";
import SlowSpecial from "./components/slow-special";
import BraveWeapon from "./components/brave-weapon";
import PreventCounterattack from "./components/prevent-counterattack";
import Map1 from "./data/maps/map1.json";
import SkillInteractionSystem from "./systems/skill-interaction";
import PreventTargetLowestDefense from "./components/prevent-target-lowest-defense";
import GuaranteedFollowup from "./components/guaranteed-followup";
import PreventFollowUp from "./components/prevent-followup";
import GuaranteedAffinity from "./components/guaranteed-affinity";
import NeutralizeAffinity from "./components/neutralize-affinity";
import DamageReduction from "./components/damage-reduction";
import NeutralizeNormalizeStaffDamage from "./components/neutralize-normalize-staff-damage";
import NormalizeStaffDamage from "./components/normalize-staff-damage";
import Teams from "./data/teams";
import Movable from "./components/movable";
import MovementSystem from "./systems/movement";
import tileBitmasks from "./data/tile-bitmasks";
import ApplyAffinity from "./components/apply-affinity";
import TileBitshifts from "./data/tile-bitshifts";
import Obstruct from "./components/obstruct";

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
            1: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            2: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            3: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            4: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            5: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            6: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            7: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
            8: [null, new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array(), new Uint16Array()],
        },
        mapId: "",
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
        skillMap: new Map()
    };

    constructor(config?: IWorldConfig) {
        super(config);
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(MapDebuff);
        this.registerComponent(Position);
        this.registerComponent(Movable);
        this.registerComponent(WarpableTile);
        this.registerComponent(NeutralizeNormalizeStaffDamage);
        this.registerComponent(NormalizeStaffDamage);
        this.registerComponent(WalkableTile);
        this.registerComponent(Effectiveness);
        this.registerComponent(MovementType);
        this.registerComponent(Skill);
        this.registerComponent(Counterattack);
        this.registerComponent(MapBuff);
        this.registerComponent(Immunity);
        this.registerComponent(Bane);
        this.registerComponent(NeutralizeMapBuffs);
        this.registerComponent(CombatBuff);
        this.registerComponent(Battling);
        this.registerComponent(Obstruct);
        this.registerComponent(DamageReduction);
        this.registerComponent(PreventCounterattack);
        this.registerComponent(Boon);
        this.registerComponent(PreventEnemyAlliesInteraction);
        this.registerComponent(Name);
        this.registerComponent(AccelerateSpecial);
        this.registerComponent(SlowSpecial);
        this.registerComponent(BraveWeapon);
        this.registerComponent(GuaranteedAffinity);
        this.registerComponent(NeutralizeAffinity);
        this.registerComponent(TargetLowestDefense);
        this.registerComponent(PreventTargetLowestDefense);
        this.registerComponent(GuaranteedFollowup);
        this.registerComponent(PreventFollowUp);
        this.registerComponent(ApplyAffinity);
        this.registerSystem("every-turn", MapEffects, [this.state]);
        this.registerSystem("combats", SkillInteractionSystem, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
        this.registerSystem("movement", MovementSystem, [this.state]);
    }

    generateMap() {
        const randomMapIndex = (1 + Math.floor(Math.random() * 90)).toString().padStart(3, "0");
        const mapId = `Z${randomMapIndex}`;
        this.state.mapId = mapId;
        const mapData = require(`./data/maps/${mapId}.json`) as typeof Map1;
        for (let y = 1; y <= mapData.tileData.length; y++) {
            const line = mapData.tileData[y - 1];
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
        const entity = this.createEntity({
            components: [{
                type: "Name",
                value: member.name
            }]
        });

        if (team === "team1") {
            entity.addComponent({
                type: "Movable"
            });
        }

        const components = this.createCharacterComponents(entity, team, member.rarity);

        for (let component of components) {
            entity.addComponent(component);
        }

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

        const tilePlacement = Map1.spawnLocations[team][teamIndex];
        const { x, y } = tilePlacement;

        entity.addComponent({
            type: "Position",
            ...tilePlacement
        });

        const mapCell = this.state.map[y][x - 1];

        if (mapCell & tileBitmasks.occupation) {
            throw new Error("Tile is already occupied");
        }

        this.state.map[y][x][0] |= Teams[team];

        if (team === "team1") {
            entity.addComponent({
                type: "Movable"
            });
        }

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
            };
            const weaponComponent = entity.addComponent(weaponComponentData)

            for (let hook in skillData) {
                const castHook = hook as keyof typeof skillData;
                if (castHook === "onEquip") {
                    skillData.onEquip.call(weaponComponent);
                } else if (typeof skillData[castHook] === "function") {
                    entitySkillDict[castHook] = entitySkillDict[castHook] || new Set();
                    entitySkillDict[castHook].add(weaponComponent);
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
            this.createHero(member, "team1", i);
        }

        for (let i = 0; i < team2.length; i++) {
            const member = team2[i];
            this.createHero(member, "team2", i);
        }
    }

    createCharacterComponents(hero: Entity, team: "team1" | "team2", rarity: number): { type: string;[k: string]: any }[] {
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
                useMagic: ["tome", "breath", "staff"].includes(dexData.weaponType)
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
