import { MandatoryStats, MovementType } from "../types";
import { WeaponColor, WeaponType } from "../weapon";

interface CharacterData {
    [k: string]: {
        color: WeaponColor;
        weaponType: WeaponType;
        movementType: MovementType;
        stats: MandatoryStats;
        growthRates: MandatoryStats;
    }
}

const CHARACTERS: CharacterData = {
    "Morgan: Devoted Darkness": {
        color: "red",
        movementType: "infantry",
        weaponType: "tome",
        stats: {
            hp: 19,
            atk: 8,
            spd: 11,
            def: 5,
            res: 4
        },
        growthRates: {
            hp: 50,
            atk: 60,
            spd: 55,
            def: 50,
            res: 40
        }
    },
    "Ryoma: Peerless Samurai": {
        color: "red",
        movementType: "infantry",
        weaponType: "sword",
        stats: {
            hp: 19,
            atk: 8,
            spd: 11,
            def: 5,
            res: 4
        },
        growthRates: {
            hp: 50,
            atk: 60,
            spd: 55,
            def: 50,
            res: 40
        }
    },
    "Klein: Silver Nobleman": {
        color: "colorless",
        movementType: "infantry",
        weaponType: "bow",
        stats: {
            hp: 18,
            atk: 9,
            spd: 7,
            def: 5,
            res: 5,
        },
        growthRates: {
            hp: 50,
            atk: 50,
            spd: 60,
            def: 35,
            res: 45
        }
    },
    "Clair: Highborn Flier": {
        weaponType: "lance",
        color: "blue",
        movementType: "flier",
        stats: {
            hp: 18,
            atk: 7,
            spd: 8,
            def: 5,
            res: 9
        },
        growthRates: {
            hp: 45,
            atk: 45,
            spd: 65,
            def: 45,
            res: 55
        }
    }
} as const;

export default CHARACTERS;
