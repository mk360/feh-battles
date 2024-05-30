import { MandatoryStats, Stat } from "../interfaces/types";
declare function getLv40Stats(lv1Stats: MandatoryStats, growthRates: MandatoryStats, rarity: number, boon?: Stat, bane?: Stat): {
    atk: number;
    def: number;
    res: number;
    spd: number;
    hp: number;
};
export default getLv40Stats;
//# sourceMappingURL=unit-stats.d.ts.map