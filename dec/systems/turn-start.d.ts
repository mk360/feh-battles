import { System } from "ape-ecs";
import GameState from "./state";
declare class TurnStartSystem extends System {
    private state;
    private heroesQuery;
    init(state: GameState): void;
    update(): void;
}
export default TurnStartSystem;
//# sourceMappingURL=turn-start.d.ts.map