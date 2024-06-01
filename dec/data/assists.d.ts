import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Assists from "../components/assist";
interface AssistsDict {
    [k: string]: {
        canApply(this: Assists, state: GameState, ally: Entity, position: {
            x: number;
            y: number;
        }): boolean;
        onApply(this: Assists, state: GameState, ally: Entity): void;
        description: string;
        range: number;
    };
}
declare const ASSISTS: AssistsDict;
export default ASSISTS;
//# sourceMappingURL=assists.d.ts.map