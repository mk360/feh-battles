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
declare function calculateDamage({ atkStat, effectiveness, advantage, affinity, defenseStat, flatReduction, damagePercentage, defensiveTerrain }: DamageCalc): number;
export default calculateDamage;
//# sourceMappingURL=calculate-damage.d.ts.map