import { System } from "ape-ecs";
import GameState from "../state";
declare class AfterCombatSystem extends System {
    private state;
    private query;
    init(state: GameState): void;
    update(): void;
}
export default AfterCombatSystem;
//# sourceMappingURL=after-combat.d.ts.map