import { Component } from "ape-ecs";
import Weapon from "../components/weapon";
import Hero from "../entities/hero";
import GameState from "../systems/state";
import { WeaponType } from "../weapon";
import { MovementType } from "../types";

interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        type: WeaponType;
        effectiveAgainst?: (MovementType | WeaponType)[];
        protects?: (MovementType | WeaponType)[];
        onCombat?(...args: any[]): any;
        onInitiate?(...args: any[]): any;
        onDefense?(...args: any[]): any;
        onEquip?(this: Weapon): any;
        onTurnStart?(battleState: GameState): void;
    }
}



type Battle = Turn[];

interface Turn {
    attacker: Hero;
    defender: Hero;
    damage: number;
    order: number; // ordre absolu
    consecutiveOrder: number; // si tours consécutifs, incrémenter ce
}

const WEAPONS: WeaponDict = {
    "Iron Bow": {
        description: "A generic Iron Bow. Effective against fliers.",
        might: 8,
        type: "bow",
        effectiveAgainst: ["flier"]
    },
    "Shielding Lance": {
        description: "A lance that protects fliers. Disables skills that are effective against fliers.",
        might: 16,
        type: "lance",
        protects: ["flier"],
    },
    "Sieglinde": {
        description: "At start of turn, grants Atk+4 to adjacent allies for 1 turn.",
        might: 16,
        type: "sword",
        onTurnStart: function (state) {

        }
    },
};

export default WEAPONS;
