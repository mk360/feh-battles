import { MandatoryStats } from "../types";
interface CharacterData {
    [k: string]: {
        color: string;
        weaponType: string;
        stats: MandatoryStats;
        growthRates: MandatoryStats;
    };
}
declare const CHARACTERS: CharacterData;
export default CHARACTERS;
//# sourceMappingURL=characters.d.ts.map