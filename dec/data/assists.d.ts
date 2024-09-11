import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Assist from "../components/assist";
import { WeaponType } from "../interfaces/types";
import MovementType from "../components/movement-type";
import Characters from "./characters.json";
type AssistKind = "refresh" | "movement" | "buff" | "healing";
interface AssistsDict {
    [k: string]: {
        canApply(this: Assist, state: GameState, ally: Entity, position: {
            x: number;
            y: number;
        }): boolean;
        onApply(this: Assist, state: GameState, ally: Entity): void;
        description: string;
        range: number;
        allowedWeaponTypes?: WeaponType[];
        allowedMovementTypes?: MovementType[];
        exclusiveTo?: (keyof typeof Characters)[];
        type: AssistKind[];
    };
}
declare const ASSISTS: AssistsDict;
export default ASSISTS;
//# sourceMappingURL=assists.d.ts.map