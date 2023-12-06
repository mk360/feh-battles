import { Entity } from "ape-ecs";
import { WeaponType } from "../weapon";
import { MovementType } from "../types";

interface GameState {
    teams: {
        team1: Entity[];
        team2: Entity[];
    };
    teamsByWeaponTypes: {
        team1: Partial<{
            [k in WeaponType]: number
        }>;
        team2: Partial<{
            [k in WeaponType]: number
        }>;
    };
    teamsByMovementTypes: {
        team1: Partial<{
            [k in MovementType]: number
        }>;
        team2: Partial<{
            [k in MovementType]: number
        }>;
    };
    currentSide: "team1" | "team2";
    turn: number;
}

export default GameState;
