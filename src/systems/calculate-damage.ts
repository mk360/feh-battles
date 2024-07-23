interface DamageCalc {
    atkStat: number;
    effectiveness: number;
    advantage: 0.2 | 0 | -0.2;
    affinity: number;
    defenseStat: number;
    flatReduction: number;
    damagePercentage: number;
    defensiveTerrain: boolean;
    specialIncreasePercentage: number;
    flatIncrease: number;
    staffPenalty: boolean;
}

// to reverse-engineer dmg: lookup "rawDmg" in https://arcticsilverfox.com/feh_sim/

function calculateDamage({ atkStat, effectiveness, advantage, affinity, defenseStat, flatReduction, damagePercentage, defensiveTerrain, flatIncrease, specialIncreasePercentage, staffPenalty }: DamageCalc) {
    const damageWithAdvantage = Math.trunc(atkStat * (advantage + (1 + affinity)));
    const damageWithEffectiveness = Math.trunc(damageWithAdvantage * effectiveness);
    const defensiveTerrainBonus = defensiveTerrain ? Math.trunc(defenseStat * 0.3) : 0;
    const netDefense = defenseStat + defensiveTerrainBonus;
    let netDamage = damageWithEffectiveness - netDefense;

    if (specialIncreasePercentage) {
        netDamage = Math.trunc(netDamage * specialIncreasePercentage);
    }

    if (flatIncrease) {
        netDamage = Math.max(0, netDamage + flatIncrease);
    }

    if (staffPenalty) {
        netDamage = Math.trunc(netDamage * 0.5);
    }

    netDamage = Math.ceil(netDamage * damagePercentage / 100);

    return Math.max(0, netDamage - Math.floor(flatReduction));
}

export default calculateDamage;
