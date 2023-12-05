import { MandatoryStats, Stat } from "../types";

function getLv40Stats(lv1Stats: MandatoryStats, growthRates: MandatoryStats, rarity: number, boon?: Stat, bane?: Stat) {
    const copy = { ...lv1Stats };
    const growthRateCopy = {...growthRates};

    if (boon && bane) {
        growthRateCopy[boon] += 5;
        copy[boon]++;
        growthRateCopy[bane] -= 5;
        copy[bane]--;
    }

    for (let stat in copy) {
        const growthRate = growthRateCopy[stat as Stat];
        const masterGrowthRate = Math.floor(growthRate * (0.79 + 0.07 * rarity));
        const growthValue = Math.floor(39 * masterGrowthRate / 100);
        copy[stat] += growthValue;
    }

    return copy;
};

export default getLv40Stats;
