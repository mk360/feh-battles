import { System } from "ape-ecs";
import GameState from "./state";
declare class MapEffectsSystem extends System {
    private state;
    init(state: GameState): void;
    getTeam(team: string): import("ape-ecs").Entity[];
}
export default MapEffectsSystem;
//# sourceMappingURL=map-effects.d.ts.map