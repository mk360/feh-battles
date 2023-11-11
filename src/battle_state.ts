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
        this.currentTurn = this.currentTurn === "team1" ? "team2" : "team1";
        this.turns[this.currentTurn]++;
    }

    static createBlankState() {
        const state = new BattleState();
        state.teams = {
            team1: new Team(),
            team2: new Team(),
        };
        state.turns = {
            team1: 1,
            team2: 0
        };

        state.currentTurn = "team1";

        // idea: compress the map into a bitboard and run binary or unary operations to get map tile type
        // use another bitboard (or merge it into the first one) to check if a tile is a defensive tile

        return state;
    }
};

const ground = 0b1111;
const tree = 0b1011;
const voidTile = 0b1000;
const trench = 0b11011;

const infantry = 0b1;
const armor = 0b10;
const cavalry = 0b100;
const flier = 0b1000;



export default BattleState;
