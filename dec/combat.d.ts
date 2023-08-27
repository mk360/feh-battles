import BattleState from "./battle_state";
import Hero from "./hero";
import { StatsBuffsTable } from "./types";
export interface Combat {
    attacker: Hero;
    defender: Hero;
    battleState: BattleState;
}
interface TurnOutcome {
    attacker: Hero;
    defender: Hero;
    attackerSpecialCooldown: number;
    defenderSpecialCooldown: number;
    attackerTriggeredSpecial: boolean;
    defenderTriggeredSpecial: boolean;
    advantage: Advantage;
    effective: boolean;
    remainingHP: number;
    damage: number;
}
interface CombatOutcomeSide {
    startHP: number;
    turns: number;
    id: string;
    remainingHP: number;
    damage: number;
    effective: boolean;
    triggeredSpecial: boolean;
    statChanges: StatsBuffsTable;
    extraDamage: number;
}
export interface CombatOutcome {
    attacker: CombatOutcomeSide;
    defender: CombatOutcomeSide;
    turns: TurnOutcome[];
}
declare type Advantage = "advantage" | "disadvantage" | "neutral";
export declare class Combat {
    private specialsManager;
    constructor({ attacker, defender, battleState }: {
        attacker: Hero;
        defender: Hero;
        battleState: BattleState;
    });
    private cloneHero;
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