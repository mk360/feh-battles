import { Entity, System } from "ape-ecs";
import GameState from "./state";
declare class CombatSystem extends System {
    private state;
    private battlingQuery;
    init(state: GameState): void;
    update(): void;
    runAllySkills(ally: Entity): void;
}
export default CombatSystem;
//# sourceMappingURL=combat.d.ts.map