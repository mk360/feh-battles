import { System } from "ape-ecs";
import GameState from "./state";
declare class BeforeCombat extends System {
    private state;
    private battlingQuery;
    init(state: GameState): void;
    update(): void;
}
export default BeforeCombat;
//# sourceMappingURL=before-combat.d.ts.map