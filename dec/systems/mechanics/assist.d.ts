import { System } from "ape-ecs";
import GameState from "../state";
declare class AssistSystem extends System {
    private state;
    private query;
    init(state: GameState): void;
    update(): void;
}
export default AssistSystem;
//# sourceMappingURL=assist.d.ts.map