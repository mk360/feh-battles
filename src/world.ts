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
import { Stat } from "./types";
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
import TileTypes from "./data/tile-types";
import SkillInteractionSystem from "./systems/skill-interaction";
import PreventTargetLowestDefense from "./components/prevent-target-lowest-defense";
import GuaranteedFollowup from "./components/guaranteed-followup";
import PreventFollowUp from "./components/prevent-followup";
import GuaranteedAdvantage from "./components/guaranteed-advantage";
import NeutralizeAffinity from "./components/neutralize-affinity";
import DamageReduction from "./components/damage-reduction";
import NeutralizeNormalizeStaffDamage from "./components/neutralize-normalize-staff-damage";
import NormalizeStaffDamage from "./components/normalize-staff-damage";
import Teams from "./data/teams";

const tileBitmasks = {
    type: {
        floor: 0b1111,
        wall: 0,
        forest: 0b111,
        void: 0b10
    },
    occupation: 0b110000,
    trench: 0b1000000,
    defensiveTile: 0b10000000
} as const;

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
    initialPosition: { x: number; y: number };
}

interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}

class GameWorld extends World {
    state: GameState = {
        /**
         * Map is stored in an 8x6 matrix of 8 bits for each cell (column x row, top-left is indexed at [1][0]).
         * This map is used to store basic information on what's the cell's type, does it have anything special
         * (trench, defensive tile) added. It acts as the source of truth in case any state or data conflict arises.
         */
        map: {
            1: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            2: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            3: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            4: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            5: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            6: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            7: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
            8: [new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array(), new Uint8Array()],
        },
        teams: {
            team1: [],
            team2: [],
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
        tiles: this.createEntity({}),
        combat: this.createEntity({})
    };

    skillMap: Map<Entity, Partial<{
        [k in "onTurnStart" | "onCombatStart"]: Skill
    }>>;

    constructor(config?: IWorldConfig) {
        super(config);
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(MapDebuff);
        this.registerComponent(Position);
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
        this.registerComponent(DamageReduction);
        this.registerComponent(PreventCounterattack);
        this.registerComponent(Boon);
        this.registerComponent(PreventEnemyAlliesInteraction);
        this.registerComponent(Name);
        this.registerComponent(AccelerateSpecial);
        this.registerComponent(SlowSpecial);
        this.registerComponent(BraveWeapon);
        this.registerComponent(GuaranteedAdvantage);
        this.registerComponent(NeutralizeAffinity);
        this.registerComponent(TargetLowestDefense);
        this.registerComponent(PreventTargetLowestDefense);
        this.registerComponent(GuaranteedFollowup);
        this.registerComponent(PreventFollowUp);
        this.registerSystem("every-turn", MapEffects, [this.state]);
        this.registerSystem("combats", SkillInteractionSystem, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
        this.skillMap = new Map();
    }

    generateMap(config: typeof Map1) {
        for (let i = 1; i <= config.length; i++) {
            const line = config[i - 1];
            for (let j = 0; j < line.length; j++) {
                const tile = line[j];
                let bitField = 0;
                const [tileType, addedCharacteristic] = tile.split("-");
                const uint8 = new Uint8Array(1);
                // initial 4 bits determine tile type
                bitField |= TileTypes[tileType as keyof typeof TileTypes];
                if (addedCharacteristic === "trench") {
                    bitField |= (1 << 5);
                }
                uint8[0] = bitField;
                this.state.map[i][j] = uint8;
            }
        }
    };

    createHero(member: HeroData, team: "team1" | "team2") {
        const entity = this.createEntity({
            components: [{
                type: "Name",
                value: member.name
            }]
        });

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

        const { x, y } = member.initialPosition;

        entity.addComponent({
            type: "Position",
            x: member.initialPosition.x,
            y: member.initialPosition.y,
        });

        const mapCell = this.state.map[y][x];

        if (mapCell & tileBitmasks.occupation) {
            throw new Error("Tile is already occupied");
        }

        this.state.map[y][x][0] |= Teams[team];

        entity.addComponent({
            type: "Battling"
        });

        const entitySkillDict: { [k: string]: any } = {};

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
            if (skillData.onEquip) {
                skillData.onEquip.call(weaponComponent);
            }
            for (let hook in skillData) {
                const castHook = hook as keyof typeof skillData;
                if (typeof skillData[castHook] === "function") {
                    entitySkillDict[castHook] = weaponComponent
                }
            }

            this.skillMap.set(entity, entitySkillDict);
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
                if (skillData.onEquip) skillData.onEquip.call(internalComponent);

                for (let hook in skillData) {
                    const castHook = hook as keyof typeof skillData;
                    if (typeof skillData[castHook] === "function") {
                        this.skillMap[castHook] = this.skillMap[castHook] || {};
                        this.skillMap[castHook][internalComponent.id] = skillData[castHook];
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

        this.state.teams[team].push(entity);

        return entity;
    }

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;

        for (let member of team1) {
            this.createHero(member, "team1");
        }

        for (let member of team2) {
            this.createHero(member, "team2");
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
                useMagic: ["tome", "breath"].includes(dexData.weaponType)
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
