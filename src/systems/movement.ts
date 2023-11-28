import { Entity, Query, System } from "ape-ecs";

class MovementSystem extends System {
    increasedMovementQuery: Query;
    gravityQuery: Query;
    obstructQuery: Query;

    init(): void {
        this.increasedMovementQuery = this.createQuery().from("IncreasedMovement");
        this.gravityQuery = this.createQuery().from("Gravity");
        this.obstructQuery = this.createQuery().from("Obstruct");
    }

    getFinalMovementRange(unit: Entity) {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("Movement").range;
    }
};

export default MovementSystem;
