import Team from "./team"

class BattleState {
    teams: {
        [k: string]: Team & { turns: number };
    }
    currentTurn: string;
};


export default BattleState;
