import { Entity, IWorldConfig, World } from "ape-ecs";
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
    private state: GameState = {
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
    };

    constructor(config?: IWorldConfig) {
        super(config);
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(MapDebuff);
        this.registerComponent(Position);
        this.registerComponent(WarpableTile);
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
        this.registerComponent(Boon);
        this.registerComponent(PreventEnemyAlliesInteraction);
        this.registerComponent(Name);
        this.registerComponent(TargetLowestDefense);
        this.registerSystem("every-turn", MapEffects, [this.state]);
        this.registerSystem("combat", CombatSystem, [this.state]);
    }

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

        entity.addComponent({
            type: "Position",
            x: member.initialPosition.x,
            y: member.initialPosition.y,
        });
        entity.addComponent({
            type: "Battling"
        });

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
                value: team
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
