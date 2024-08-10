import { Entity } from "ape-ecs";
import { MovementType, WeaponType } from "../interfaces/types";
import Skill from "../components/skill";
import SkillHook from "../interfaces/skill-hook";
interface GameState {
    teamIds: [string, string];
    lastChangeSequence: string[];
    teams: {
        [teamId: string]: Set<Entity>;
    };
    mapId: string;
    topology: JSONMapData;
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
        [teamId: string]: Partial<{
            [k in WeaponType]: number;
        }>;
    };
    teamsByMovementTypes: {
        [teamId: string]: Partial<{
            [k in MovementType]: number;
        }>;
    };
    currentSide: string;
    turn: number;
    skillMap: Map<Entity, Partial<{
        [hook in SkillHook]: Set<Skill>;
    }>>;
    occupiedTilesMap: Map<Uint16Array, Entity>;
}
export default GameState;
//# sourceMappingURL=state.d.ts.map