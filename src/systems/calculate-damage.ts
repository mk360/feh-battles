interface DamageCalc {
    atkStat: number;
    effectiveness: number;
    advantage: number;
    affinity: number;
    defenseStat: number;
    flatReduction: number;
    damagePercentage: number;
    defensiveTerrain: boolean;
}

function calculateDamage({ atkStat, effectiveness, advantage, affinity, defenseStat, flatReduction, damagePercentage, defensiveTerrain }: DamageCalc) {
    let atkWithAdvantage = Math.floor(atkStat * advantage);
    let atkWithEffectiveness = Math.floor(atkWithAdvantage * effectiveness);
    let baseDamage = atkWithEffectiveness - Math.floor(defenseStat * (defensiveTerrain ? 1.3 : 1));
    let finalDamage = Math.max(0, baseDamage - flatReduction);

    return finalDamage;
}

export default calculateDamage;
