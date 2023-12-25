import { Entity } from "ape-ecs";
import GameState from "../systems/state";

interface AssistsDict {
    [k: string]: {
        canApply?(state: GameState, ally: Entity): boolean;
        onApply?(state: GameState, ally: Entity): void;
        description: string;
        range: number;
    }
}

const ASSISTS: AssistsDict = {
    "Pivot": {
        range: 1,
        description: "Unit moves to opposite side of target ally."
    }
} as const;

export default ASSISTS;
