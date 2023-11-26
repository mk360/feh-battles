import { Component, World } from "ape-ecs";
import Weapon from "./components/weapon";
import UnitStatsSystem from "./systems/unit-stats";
import MapEffects from "./systems/map-effects";
import Stats from "./components/stats";
import CHARACTERS from "./data/characters";
import Side from "./components/side";
import Skill from "./entities/skill";
import WEAPONS from "./data/weapons";

class GameWorld extends World {
    constructor() {
        super({
            cleanupPools: true,
        });
        this.registerComponent(Weapon);
        this.registerComponent(Stats);
        this.registerComponent(Side);
        this.registerComponent(Skill);
        this.registerSystem("every-turn", UnitStatsSystem);
        this.registerSystem("every-turn", MapEffects);

        const p1 = this.createEntity({
            components: this.createCharacterComponents("Ryoma: Peerless Samurai").concat({ type: "Side", value: "team1" }),
            name: "Ryoma: Peerless Samurai"
        });

        p1.addComponent({
            type: "Skill",
            ...WEAPONS["Raijinto"],
            slot: "Weapon"
        });

        const p2 = this.createEntity({
            components: this.createCharacterComponents("Morgan: Devoted Darkness").concat({ type: "Side", value: "team2" }),
            name: "Morgan: Devoted Darkness"
        });

        p2.addComponent({
            type: "Skill",
            ...WEAPONS["Axe of Despair"],
            slot: "weapon"
        });

        this.teams = {
            team1: [p1.id],
            team2: [p2.id]
        }
    }

    createCharacterComponents(character: keyof typeof CHARACTERS): { type: string; [k: string]: any }[] {
        return [
            {
                type: "Stats",
                ...CHARACTERS[character].stats
            },
            {
                type: "Weapon",
                weaponType: CHARACTERS[character].weaponType,
                color: CHARACTERS[character].color,
                range: ["Sword", "Lance", "Axe", "Beast", "Breath"].includes(CHARACTERS[character].weaponType) ? 1 : 2,
                useMagic: ["Tome", "Breath"].includes(CHARACTERS[character].weaponType)
            }
        ] as { type: string }[]
    }
};

export default GameWorld;
