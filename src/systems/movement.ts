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
        const hasIncreasedMovement = !!unit.getOne("IncreasedMovement");
        const hasGravity = !!unit.getOne("Gravity");

        if (hasGravity) return 1;

        if (hasIncreasedMovement) return unit.getOne("Movement").range + 1;

        return unit.getOne("Movement").range;
    }
};

export default MovementSystem;
