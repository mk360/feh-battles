import { System } from "ape-ecs";
import GameState from "./state";
declare class MapEffectsSystem extends System {
    private state;
    private heroesQuery;
    init(state: GameState): void;
    update(): void;
    getCurrentTeam(): import("ape-ecs").Entity[];
}
export default MapEffectsSystem;
//# sourceMappingURL=map-effects.d.ts.map