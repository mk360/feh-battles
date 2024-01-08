import { MandatoryStats, MovementType, WeaponColor, WeaponType } from "../interfaces/types";
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
