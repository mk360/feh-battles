import { Component } from "ape-ecs";

interface WeaponDict {
    [k: string]: {
        description: string;
        onCombatStart(context: any): Component[];
    }
}

const WEAPONS: WeaponDict = {
    "Raijinto": {
        description: "Les 1000 Oiseaux",
        onCombatStart(context) {
            return [];
        }
    }
};

export default WEAPONS;
