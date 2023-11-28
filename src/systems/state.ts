import { Entity } from "ape-ecs";

interface GameState {
    teams: {
        team1: Entity[];
        team2: Entity[];
    };
    currentSide: "team1" | "team2";
    turn: number;
}

export default GameState;
