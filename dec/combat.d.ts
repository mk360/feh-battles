import Hero from "./hero";
import { StatsBuffsTable } from "./types";
export interface Combat {
    attacker: Hero;
    defender: Hero;
}
interface TurnOutcome {
    attacker: Hero;
    defender: Hero;
    advantage: "advantage" | "disadvantage" | "neutral";
    effective: boolean;
    remainingHP: number;
    damage: number;
}
interface CombatOutcome {
    atkChanges: StatsBuffsTable;
    defChanges: StatsBuffsTable;
    atkRemainingHP: number;
    defRemainingHP: number;
    atkDamage: number;
    defDamage: number;
    outcome: TurnOutcome[];
}
export declare class Combat {
    constructor({ attacker, defender }: {
        attacker: Hero;
        defender: Hero;
    });
    private callAttackerHook;
    private callDefenderHook;
    private callSkillHook;
    private runAllAttackerSkillsHooks;
    private getAffinity;
    private produceDamage;
    private calculateDamage;
    private generateStartupTurns;
    private runAllDefenderSkillsHooks;
    private stackSameTurns;
    private setupTurns;
    private getPreviousAttackTurns;
    private handleFollowups;
    private runAllSkillsHooks;
    private runAllyHooks;
    createCombat(): CombatOutcome;
}
export default Combat;
//# sourceMappingURL=combat.d.ts.map