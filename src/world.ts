import { Entity, World } from "ape-ecs";
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
        currentSide: "team1",
        turn: 1
    };

    constructor() {
        super();
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(Position);
        this.registerComponent(WarpableTile);
        this.registerComponent(WalkableTile);
        this.registerComponent(Effectiveness);
        this.registerComponent(MovementType);
        this.registerComponent(Skill);
        this.registerComponent(Immunity);
        this.registerComponent(Bane);
        this.registerComponent(Boon);
        this.registerSystem("every-turn", MapEffects, [this.state]);
    }

    createHero(member: HeroData) {
        this.registerTags(member.name);

        const entity = this.createEntity({
            tags: [member.name]
        });
        const components = this.createCharacterComponents(entity, "team1", member.rarity);

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

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;

        for (let member of team1) {
            this.createHero(member);
        }

        for (let member of team2) {
            this.createHero(member);
        }
    }

    createCharacterComponents(hero: Entity, team: string, rarity: number): { type: string;[k: string]: any }[] {
        const newStats = getLv40Stats(hero, rarity);
        const [name] = hero.tags;
        const dexData = CHARACTERS[name];

        return [
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
        ];
    }
};

export default GameWorld;
