import Team from "./team";
declare class BattleState {
    teams: {
        team1: Team;
        team2: Team;
    };
    turns: {
        team1: number;
        team2: number;
    };
    currentTurn: "team1" | "team2";
    endTurn(): void;
    static createBlankState(): BattleState;
}
export default BattleState;
//# sourceMappingURL=battle_state.d.ts.map