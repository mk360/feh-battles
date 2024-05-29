interface DamageCalc {
    atkStat: number;
    effectiveness: number;
    advantage: 0.2 | 0 | -0.2;
    affinity: number;
    defenseStat: number;
    flatReduction: number;
    damagePercentage: number;
    defensiveTerrain: boolean;
}

// to reverse-engineer dmg: lookup "rawDmg" in https://arcticsilverfox.com/feh_sim/

function calculateDamage({ atkStat, effectiveness, advantage, affinity, defenseStat, flatReduction, damagePercentage, defensiveTerrain }: DamageCalc) {
    const rawDamage = Math.trunc(atkStat * effectiveness);
    const damageWithAdvantage = Math.trunc(atkStat * effectiveness * (advantage + affinity));
    const defensiveTerrainBonus = defensiveTerrain ? Math.trunc(defenseStat * 0.3) : 0;
    const syntheticDefense = defenseStat + defensiveTerrainBonus + flatReduction;

    return Math.max(0, rawDamage + damageWithAdvantage - syntheticDefense);
}

export default calculateDamage;
