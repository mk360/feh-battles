import { MandatoryStats, Stat, Stats } from "../interfaces/types";

function getLv40Stats(lv1Stats: MandatoryStats, growthRates: MandatoryStats, rarity: number, boon?: Stat, bane?: Stat, merges?: number) {
    const copy = { ...lv1Stats };
    const growthRateCopy = { ...growthRates };

    if (boon && bane) {
        growthRateCopy[boon] += 5;
        copy[boon]++;
        growthRateCopy[bane] -= 5;
        copy[bane]--;
    }

    const sortedStats: { stat: Stat, value: number }[] = Object.keys(copy).map((stat: Stat) => ({
        stat,
        value: copy[stat]
    })).sort((stat1, stat2) => stat2.value - stat1.value);

    let mergeIncreases: Stats;

    if (merges) {
        mergeIncreases = getMergeIncreases(sortedStats, merges, boon, bane);
    }

    const rarityChanges = getRarityChanges(sortedStats, rarity);

    if (mergeIncreases) {
        for (let stat in copy) {
            copy[stat] += mergeIncreases[stat];
        }
    }

    for (let stat in rarityChanges) {
        copy[stat] += rarityChanges[stat];
    }

    for (let stat in copy) {
        const growthRate = growthRateCopy[stat as Stat];
        const masterGrowthRate = Math.floor(growthRate * (0.79 + 0.07 * rarity));
        const growthValue = Math.floor(39 * masterGrowthRate / 100);
        copy[stat] += growthValue;
    }

    return copy;
};

function getRarityChanges(sortedStats: { stat: Stat, value: number }[], rarity: number) {
    let statChanges: Stats = {
        atk: 0,
        hp: 0,
        def: 0,
        res: 0,
        spd: 0
    };

    if (rarity < 5) {
        statChanges[sortedStats[3].stat]--;
        statChanges[sortedStats[4].stat]--;
        statChanges.hp--;
    }
    if (rarity < 4) {
        statChanges[sortedStats[1].stat]--;
        statChanges[sortedStats[2].stat]--;
    }
    if (rarity < 3) {
        statChanges[sortedStats[3].stat]--;
        statChanges[sortedStats[4].stat]--;
        statChanges.hp--;
    }
    if (rarity < 2) {
        statChanges[sortedStats[1].stat]--;
        statChanges[sortedStats[2].stat]--;
    }

    return statChanges;
}

function getMergeIncreases(sortedStats: { stat: Stat, value: number }[], mergeCount: number, boon: Stat, bane: Stat) {
    let statChanges: Stats = {
        atk: 0,
        hp: 0,
        def: 0,
        res: 0,
        spd: 0
    };

    let firstMerge = [0, 1];
    if (!boon && !bane) firstMerge = firstMerge.concat([0, 1, 2]);
    let secondMerge = [2, 3];
    let thirdMerge = [4, 0];
    let fourthMerge = [1, 2];
    let fifthMerge = [3, 4];
    let sixthMerge = [0, 1];
    let statIndices = [firstMerge, secondMerge, thirdMerge, fourthMerge, fifthMerge, sixthMerge, secondMerge, thirdMerge, fourthMerge, fifthMerge];

    for (let i = 0; i < mergeCount; i++) {
        let boostedStatsOrder = statIndices[i];
        for (let statIndex of boostedStatsOrder) {
            let { stat } = sortedStats[statIndex];
            statChanges[stat]++;
        }
    }

    return statChanges;
};

export default getLv40Stats;
