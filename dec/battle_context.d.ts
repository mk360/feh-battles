import Team from "./team";
declare class BattleContext {
    teams: {
        team1: Team;
        team2: Team;
    };
    turns: {
        team1: number;
        team2: number;
    };
    currentTurn: keyof this["teams"];
    static createBlankState(): BattleContext;
}
export default BattleContext;
//# sourceMappingURL=battle_context.d.ts.map