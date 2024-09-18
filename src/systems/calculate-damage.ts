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
    let damageWithoutReduction = damageWithEffectiveness - netDefense;

    if (specialIncreasePercentage) {
        damageWithoutReduction = Math.trunc(damageWithoutReduction * specialIncreasePercentage);
    }

    if (flatIncrease) {
        damageWithoutReduction = Math.max(0, damageWithoutReduction + flatIncrease);
    }

    if (staffPenalty) {
        damageWithoutReduction = Math.trunc(damageWithoutReduction * 0.5);
    }

    return damageWithoutReduction;
}

export function calculateFinalDamage({ netDamage, flatReduction, damagePercentage }: { netDamage: number, flatReduction: number, damagePercentage: number }) {


    netDamage = Math.ceil(netDamage * damagePercentage / 100);

    return Math.max(0, netDamage - Math.floor(flatReduction));
}

