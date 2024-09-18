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
export declare function calculateDamageBeforeReductions({ atkStat, effectiveness, advantage, affinity, defenseStat, defensiveTerrain, flatIncrease, specialIncreasePercentage, staffPenalty }: DamageCalc): number;
export declare function calculateFinalDamage({ netDamage, flatReduction, damagePercentage }: {
    netDamage: number;
    flatReduction: number;
    damagePercentage: number;
}): number;
export {};
//# sourceMappingURL=calculate-damage.d.ts.map