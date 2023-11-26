import { Entity, Query, System } from "ape-ecs";
declare class MovementSystem extends System {
    increasedMovementQuery: Query;
    gravityQuery: Query;
    obstructQuery: Query;
    init(): void;
    getFinalMovementRange(unit: Entity): any;
}
export default MovementSystem;
//# sourceMappingURL=movement.d.ts.map