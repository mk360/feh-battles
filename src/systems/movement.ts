import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";

class MovementSystem extends System {
    private increasedMovementQuery: Query;
    private obstructQuery: Query;
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
        this.obstructQuery = this.createQuery().from("Obstruct");
    }

    update() {
        const obstruct = Array.from(this.obstructQuery.execute()).filter((entity) => entity.getOne("Side").value !== this.state.currentSide);
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

export default MovementSystem;
