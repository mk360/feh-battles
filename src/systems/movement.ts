import { Entity, Query, System } from "ape-ecs";
import getEnemies from "../utils/get-enemies";
import GameState from "./state";

class MovementSystem extends System {
    private obstructQuery: Query;
    private checkRangeQuery: Query;
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
        this.obstructQuery = this.createQuery().from("Obstruct");
        this.checkRangeQuery = this.createQuery().from("CheckRange");
    }

    update() {
        this.state.tiles.getComponents("WalkTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("WarpTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("AttackTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("AssistTile").forEach((c) => this.state.tiles.removeComponent(c));
        // 
        const checkedPositionEntity = this.checkRangeQuery.execute();
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

export default MovementSystem;
