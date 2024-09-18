import { System } from "ape-ecs";
import GameState from "../state";
declare class HealSystem extends System {
    private healableQuery;
    init(state: GameState): void;
    update(): void;
}
export default HealSystem;
//# sourceMappingURL=heal.d.ts.map