import Team from "./team";
declare class BattleState {
    teams: {
        [k: string]: Team & {
            turns: number;
        };
    };
    currentTurn: string;
}
export default BattleState;
//# sourceMappingURL=battle_state.d.ts.map