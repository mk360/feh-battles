import { Entity, Query, System } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";
import GameState from "./state";

function getSurroundings(map: GameState["map"], y: number, x: number, checkedTiles: Set<Uint16Array>, sideBitfield: number, mvtBitfield: number) {
    if (checkedTiles.has(map[y][x])) return [];
    const arr: Uint16Array[] = [map[y][x]];
    if (map[y - 1] && map[y - 1][x]) {
        checkedTiles.add(map[y - 1][x]);
        arr.push(map[y - 1][x]);
    }

    if (map[y][x - 1] && !checkedTiles.has(map[y][x - 1])) {
        checkedTiles.add(map[y][x - 1]);
        arr.push(map[y][x - 1]);
    }

    if (map[y][x + 1] && !checkedTiles.has(map[y][x + 1])) {
        checkedTiles.add(map[y][x + 1]);
        arr.push(map[y][x + 1]);
    }

    if (map[y + 1] && map[y + 1][x] && !checkedTiles.has(map[y + 1][x])) {
        checkedTiles.add(map[y + 1][x]);
        arr.push(map[y + 1][x]);
    }

    const tilesWithoutEnemies = arr.filter((uint8) => {
        return (uint8[0] & sideBitfield) || ((uint8[0] >> tileBitmasks.occupation & 0b11) === 0);
    });

    const validTiles = tilesWithoutEnemies.filter((uint8) => {
        return uint8[0] & mvtBitfield;
    });

    return validTiles;
}

class MovementSystem extends System {
    private obstructQuery: Query;
    private checkRangeQuery: Query;
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
        this.obstructQuery = this.createQuery().fromAll("Obstruct");
        this.checkRangeQuery = this.createQuery().from("CheckRange");
    }

    update() {
        this.state.tiles.getComponents("WalkTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("WarpTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("AttackTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.state.tiles.getComponents("AssistTile").forEach((c) => this.state.tiles.removeComponent(c));
        const [unit] = this.createQuery().fromAll("Movable").execute();
        const { bitfield: sideBitfield } = unit.getOne("Side");
        const { bitfield: mvtBitfield } = unit.getOne("Side");
        const { x, y } = unit.getOne("Position");
        const walkMap = new Set<Uint16Array>();
        const obstructors = this.obstructQuery.execute();
        for (let obstructor of obstructors) {
            for (let skill of this.state.skillMap.get(obstructor).onEnemyCheckRange) {

            }
        }
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

export default MovementSystem;
