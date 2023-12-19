import { Entity } from "ape-ecs";
import { WeaponType } from "../weapon";
import { MovementType } from "../types";

interface GameState {
    teams: {
        team1: Set<Entity>;
        team2: Set<Entity>;
    };
    tiles: Entity;
    combat: Entity;
    map: {
        1: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        2: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        3: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        4: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        5: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        6: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        7: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
        8: [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array];
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
