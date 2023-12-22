import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";

function getSurroundings(map: GameState["map"], hero: Entity, y: number, x: number, checkedTiles: Set<string>) {
    const { bitfield } = hero.getOne("Side");
    const { bitfield: mvtBitfield } = hero.getOne("MovementType");
    const arr: Uint8Array[] = [];
    if (map[y - 1] && map[y - 1][x]) {
        arr.push(map[y - 1][x]);
    }

    if (map[y][x - 1]) {
        arr.push(map[y][x - 1]);
    }

    if (map[y][x + 1]) {
        arr.push(map[y][x + 1]);
    }

    if (map[y + 1] && map[y + 1][x]) {
        arr.push(map[y + 1][x]);
    }

    const tilesWithoutEnemies = arr.filter((uint8) => {
        return (uint8[0] & bitfield) || ((uint8[0] >> 4 & 0b11) === 0);
    });

    const validTiles = tilesWithoutEnemies.filter((uint8) => {
        return uint8[0] & mvtBitfield
    });

    return validTiles;
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
        const [unit] = this.createQuery().fromAll("Movable").execute();
        console.log(this.createQuery().fromAll("Movable").execute());
        console.log(getSurroundings(this.state.map, unit, 1, 0, new Set()));
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
