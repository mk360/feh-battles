import Hero from "./hero";
export interface Combat {
    attacker: Hero;
    defender: Hero;
}
export declare class Combat {
    constructor({ attacker, defender }: {
        attacker: any;
        defender: any;
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
    createCombat(): any[];
}
export default Combat;
//# sourceMappingURL=combat.d.ts.map