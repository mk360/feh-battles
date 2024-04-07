interface DamageCalc {
    atkStat: number;
    effectiveness: number;
    advantage: number;
    affinity: number;
    defenseStat: number;
    flatReduction: number;
    damagePercentage: number;
}
declare function calculateDamage({ atkStat, effectiveness, advantage, affinity, defenseStat, flatReduction, damagePercentage }: DamageCalc): number;
export default calculateDamage;
//# sourceMappingURL=calculate-damage.d.ts.map