import { System } from "ape-ecs";
import GameState from "./state";
declare class KillSystem extends System {
    private state;
    private query;
    init(state: GameState): void;
    update(): void;
}
export default KillSystem;
//# sourceMappingURL=kill.d.ts.map