import Team from "./team"

class BattleState {
    teams: {
        team1: Team;
        team2: Team;
    };
    turns: {
        team1: number;
        team2: number;
    };
    currentTurn: "team1" | "team2";

    endTurn() {
        this.turns[this.currentTurn]++;
        this.currentTurn = this.currentTurn === "team1" ? "team2" : "team1";
    }

    

    static createBlankState() {
        const state = new BattleState();
        state.teams = {
            team1: new Team(),
            team2: new Team(),
        };
        state.turns = {
            team1: 0,
            team2: 0
        };

        state.currentTurn = "team1";

        // idea: compress the map into a bitboard and run binary or unary operations to get map tile type
        // use another bitboard (or merge it into the first one) to check if a tile is a defensive tile

        return state;
    }
};


export default BattleState;
