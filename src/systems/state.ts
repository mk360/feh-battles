import { Entity } from "ape-ecs";
import { WeaponType } from "../weapon";
import { MovementType } from "../types";
import Skill from "../components/skill";
import SkillHook from "../interfaces/skill-hook";

interface GameState {
    teams: {
        team1: Set<Entity>;
        team2: Set<Entity>;
    };
    tiles: Entity;
    combat: Entity;
    map: {
        1: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        2: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        3: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        4: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        5: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        6: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        7: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
        8: [Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array, Uint16Array];
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
        [k in SkillHook]: Set<Skill>;
    }>>;
}

export default GameState;
