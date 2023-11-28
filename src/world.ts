import { World } from "ape-ecs";
import Weapon from "./components/weapon";
import UnitStatsSystem from "./systems/unit-stats";
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

interface HeroData {
    name: string;
    rarity: number;
    skills: {
        weapon: string;
        assist: string;
        special: string;
        A: string;
        B: string;
        C: string;
        S: string;
    };
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
        currentSide: "team1",
        turn: 1
    };

    constructor() {
        super();
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(Position);
        this.registerComponent(Effectiveness);
        this.registerComponent(MovementType);
        this.registerComponent(Skill);
        this.registerComponent(Immunity);
        this.registerSystem("every-turn", UnitStatsSystem, [this.state]);
        this.registerSystem("every-turn", MapEffects, [this.state]);
    }

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;

        for (let member of team1) {
            const components = this.createCharacterComponents(member.name, member.rarity, "team1");
            const entity = this.createEntity({
                components,
            });

            this.registerTags(member.name);

            entity.addTag(member.name);

            entity.addComponent({
                type: "Position",
                x: member.initialPosition.x,
                y: member.initialPosition.y,
            });

            for (let skill in member.skills) {
                const skillName = member.skills[skill];
                const skillData = WEAPONS[skillName];
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

            this.state.teams.team1.push(entity);
        }

        for (let member of team2) {
            const components = this.createCharacterComponents(member.name, member.rarity, "team2");
            const entity = this.createEntity({
                components,
                name: member.name
            });
            entity.addComponent({
                type: "Position",
                x: member.initialPosition.x,
                y: member.initialPosition.y,
            });

            for (let skill in member.skills) {
                const skillData = WEAPONS[member.skills[skill]];
                if (skillData) {
                    const skillComponent = {
                        type: "Skill",
                        name: member.skills[skill],
                        description: skillData.description,
                        slot: skill,
                    };

                    const internalComponent = entity.addComponent(skillComponent);

                    if (skillData.onEquip) skillData.onEquip.call(internalComponent);
                }
            }

            this.state.teams.team2.push(entity);
        }
    }

    createCharacterComponents(character: string, rarity: number, team: string): { type: string;[k: string]: any }[] {
        const dexData = CHARACTERS[character];
        const newStats = UnitStatsSystem.getLv40Stats(dexData.stats, dexData.growthRates, rarity);
        return [
            {
                type: "Stats",
                ...newStats
            },
            {
                type: "Weapon",
                weaponType: dexData.weaponType,
                color: dexData.color,
                range: ["Sword", "Lance", "Axe", "Beast", "Breath"].includes(dexData.weaponType) ? 1 : 2,
                useMagic: ["Tome", "Breath"].includes(dexData.weaponType)
            },
            {
                type: "Side",
                value: team
            },
            {
                type: "MovementType",
                value: dexData.movementType,
            }
        ] as { type: string }[]
    }
};

export default GameWorld;
