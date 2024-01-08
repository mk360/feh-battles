import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Skill from "../components/skill";
interface AssistsDict {
    [k: string]: {
        canApply(this: Skill, state: GameState, ally: Entity): boolean;
        onApply(this: Skill, state: GameState, ally: Entity): void;
        description: string;
        range: number;
    };
}
declare const ASSISTS: AssistsDict;
export default ASSISTS;
//# sourceMappingURL=assists.d.ts.map