import { MandatoryStats, MovementType } from "../types";
import { WeaponColor, WeaponType } from "../weapon";
import Characters from "./characters.json";

interface CharacterData {
    [k: string]: {
        color: WeaponColor;
        weaponType: WeaponType;
        movementType: MovementType;
        stats: MandatoryStats;
        growthRates: MandatoryStats;
    }
}

export default Characters as CharacterData;
