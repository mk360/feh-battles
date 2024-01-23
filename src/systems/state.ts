import { Entity } from "ape-ecs";
import { MovementType, WeaponType } from "../interfaces/types";
import Skill from "../components/skill";
import SkillHook from "../interfaces/skill-hook";

interface GameState {
    teams: {
        team1: Set<Entity>;
        team2: Set<Entity>;
    };
    map: {
        1: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        2: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        3: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        4: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        5: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        6: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        7: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        8: [null, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
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
    skillMap: Map<Entity, Partial<{
        [hook in SkillHook]: Set<Skill>;
    }>>;
}

export default GameState;
