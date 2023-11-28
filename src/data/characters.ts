import { MandatoryStats } from "../types";

interface CharacterData {
    [k: string]: {
        color: string;
        weaponType: string;
        stats: MandatoryStats;
        growthRates: MandatoryStats;
    }
}


const CHARACTERS: CharacterData = {
    "Morgan: Devoted Darkness": {
        color: "Red",
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
        color: "Red",
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
    }
} as const;

export default CHARACTERS;
