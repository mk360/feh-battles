import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";

function getSurroundings(map: GameState["map"], hero: Entity, y: number, x: number, checkedTiles: string[]) {
    const { bitfield } = hero.getOne("Side");
    const arr = [];
    if (map[y - 1]) {
        arr.push(map[y - 1][x - 1]);
        arr.push(map[y - 1][x + 1]);
    }

    if (map[y][x - 1]) arr.push(map[y][x - 1]);
    if (map[y][x + 1]) arr.push(map[y][x + 1]);

    // if occupied by a foe or if it's an invalid tile type, filter out
}

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
        const [unit] = this.createQuery().from("Movable").execute();
        const finalMovementRange = this.getFinalMovementRange(unit);
        const { x, y } = unit.getOne("Position");
        
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

export default MovementSystem;
