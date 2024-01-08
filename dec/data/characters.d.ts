import { MandatoryStats, MovementType, WeaponColor, WeaponType } from "../interfaces/types";
interface CharacterData {
    [k: string]: {
        color: WeaponColor;
        weaponType: WeaponType;
        movementType: MovementType;
        stats: MandatoryStats;
        growthRates: MandatoryStats;
    };
}
declare const _default: CharacterData;
export default _default;
//# sourceMappingURL=characters.d.ts.map