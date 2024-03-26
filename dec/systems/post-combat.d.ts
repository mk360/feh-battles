import { System } from "ape-ecs";
import GameState from "./state";
declare class PostCombatSystem extends System {
    private state;
    init(state: GameState): void;
}
export default PostCombatSystem;
//# sourceMappingURL=post-combat.d.ts.map