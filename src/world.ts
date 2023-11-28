import { World } from "ape-ecs";
import Weapon from "./components/weapon";
import UnitStatsSystem from "./systems/unit-stats";
import MapEffects from "./systems/map-effects";
import Stats from "./components/stats";
import CHARACTERS from "./data/characters";
import Side from "./components/side";
import Skill from "./components/skill";
import WEAPONS from "./data/weapons";
import shortid from "shortid";
import GameState from "./systems/state";

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
        currentSide: "team1"
    };
    id: string;

    constructor(id: string) {
        super({
            cleanupPools: true,
        });
        this.id = id;
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(Skill);
        this.registerSystem("every-turn", UnitStatsSystem, [{ state: this.state }]);
        this.registerSystem("every-turn", MapEffects, [{ state: this.state }]);
    }

    initiate(lineup: InitialLineup) {
        const { team1, team2 } = lineup;

        for (let member of team1) {
            const components = this.createCharacterComponents(member.name, member.rarity, "team1");
            const entity = this.createEntity({
                components,
                name: member.name
            });

            for (let skill in member.skills) {
                const skillData = WEAPONS[skill];
                const skillComponent = {
                    type: "Skill",
                    description: skillData.description,
                    slot: skill,
                    wielder: entity
                };

                entity.addComponent(skillComponent);
            }

            this.state.teams.team1.push(entity.id);
        }

        for (let member of team2) {
            const components = this.createCharacterComponents(member.name, member.rarity, "team2");
            const entity = this.createEntity({
                components,
                name: member.name
            });

            for (let skill in member.skills) {
                const skillData = WEAPONS[skill];
                const skillComponent = {
                    type: "Skill",
                    description: skillData.description,
                    slot: skill,
                    wielder: entity
                };

                entity.addComponent(skillComponent);
            }

            this.state.teams.team2.push(entity.id);
        }

        // const p1 = this.createEntity({
        //     components: this.createCharacterComponents("Ryoma: Peerless Samurai").concat({ type: "Side", value: "team1" }),
        //     name: "Ryoma: Peerless Samurai"
        // });

        // p1.addComponent({
        //     type: "Skill",
        //     ...WEAPONS["Raijinto"],
        //     slot: "Weapon"
        // });

        // const p2 = this.createEntity({
        //     components: this.createCharacterComponents("Morgan: Devoted Darkness").concat({ type: "Side", value: "team2" }),
        //     name: "Morgan: Devoted Darkness"
        // });

        // p2.addComponent({
        //     type: "Skill",
        //     ...WEAPONS["Axe of Despair"],
        //     slot: "weapon"
        // });

        // this.state.teams.team1.push(p1.id);
        // this.state.teams.team2.push(p2.id);
    }

    createCharacterComponents(character: string, rarity: number, team: string): { type: string; [k: string]: any }[] {
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
                type: "Position",
                x: 2,
                y: 2
            }
        ] as { type: string }[]
    }
};

export default GameWorld;
