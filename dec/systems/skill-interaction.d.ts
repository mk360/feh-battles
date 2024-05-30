import { System } from "ape-ecs";
import GameState from "./state";
declare class SkillInteractionSystem extends System {
    private state;
    private battlingQuery;
    init(state: GameState): void;
    update(): void;
}
export default SkillInteractionSystem;
//# sourceMappingURL=skill-interaction.d.ts.map