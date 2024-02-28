import { Entity, System } from "ape-ecs";
import GameState from "./state";
declare class MovementSystem extends System {
    private state;
    private pathfinderQuery;
    private movableQuery;
    private obstructQuery;
    init(state: GameState): void;
    update(): void;
    getTileCost(hero: Entity, tile: Uint16Array, pathfinder: Uint16Array[]): 0 | 2 | 3 | 1;
    getMovementTiles(hero: Entity, checkedTile: Uint16Array, pathfinderTiles: Uint16Array[], remainingRange?: number): Set<Uint16Array>;
    getFinalMovementRange(unit: Entity): number;
}
export default MovementSystem;
//# sourceMappingURL=movement.d.ts.map