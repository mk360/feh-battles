interface DamageCalc {
    atkStat: number;
    effectiveness: number;
    advantage: 0.2 | 0 | -0.2;
    affinity: number;
    defenseStat: number;
    defensiveTerrain: boolean;
    specialIncreasePercentage: number;
    flatIncrease: number;
    staffPenalty: boolean;
}

// to reverse-engineer dmg: lookup "rawDmg" in https://arcticsilverfox.com/feh_sim/

export function calculateDamageBeforeReductions({ atkStat, effectiveness, advantage, affinity, defenseStat, defensiveTerrain, flatIncrease, specialIncreasePercentage, staffPenalty }: DamageCalc) {
    const damageWithAdvantage = Math.trunc(atkStat * (advantage + (1 + affinity)));
    const damageWithEffectiveness = Math.trunc(damageWithAdvantage * effectiveness);
    const defensiveTerrainBonus = defensiveTerrain ? Math.trunc(defenseStat * 0.3) : 0;
    const netDefense = defenseStat + defensiveTerrainBonus;
    let damageWithoutReduction = Math.max(damageWithEffectiveness - netDefense, 0);

    if (specialIncreasePercentage) {
        damageWithoutReduction = Math.trunc(damageWithoutReduction + damageWithoutReduction * specialIncreasePercentage / 100);
    }

    if (flatIncrease) {
        damageWithoutReduction = Math.max(0, damageWithoutReduction + flatIncrease);
    }

    if (staffPenalty) {
        damageWithoutReduction = Math.trunc(damageWithoutReduction * 0.5);
    }

    return Math.max(damageWithoutReduction, 0);
}

export function calculateFinalDamage({ netDamage, flatReduction, damagePercentage }: { netDamage: number, flatReduction: number, damagePercentage: number }) {
    let newNetDamage = Math.ceil(netDamage * damagePercentage / 100);

    return Math.max(0, newNetDamage - Math.floor(flatReduction));
}

