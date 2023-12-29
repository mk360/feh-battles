import { Entity, Query, System } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import GameState from "./state";
import TileTypes from "../data/tile-types";
import canReachTile from "./can-reach-tile";
import getSurroundings from "./get-surroundings";
import PASSIVES from "../data/passives";

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
        const allies = getAllies(this.state, unit);
        const obstructors = getEnemies(this.state, unit);
        for (let ally of allies) {
            if (this.state.skillMap.get(ally).onTurnAllyCheckRange) {
                for (let skill of this.state.skillMap.get(ally).onTurnAllyCheckRange) {
                    const skillData = PASSIVES[skill.name];
                    skillData.onTurnAllyCheckRange.call(skill, this.state, unit);
                }
            }
        }
        if (!unit.getOne("Pass")) {
            for (let obstructor of obstructors) {
                if (this.state.skillMap.get(obstructor).onTurnAllyCheckRange) {
                    for (let skill of this.state.skillMap.get(obstructor).onTurnEnemyCheckRange) {
                    }
                }
            }
        }
    }

    geTileCost(hero: Entity, tile: Uint16Array) {
        const [tileBitfield] = tile;
        const movementType = hero.getOne("MovementType");
        if ((tileBitfield & TileTypes.forest) && movementType.value === "infantry") {
            return 2;
        }

        if ((tileBitfield & tileBitmasks.trench) && movementType.value === "cavalry") {
            return 3;
        }

        return 1;
    }

    getMovementTiles(hero: Entity, checkedX: number, checkedY: number, range?: number) {
        let finalRange = range ?? this.getFinalMovementRange(hero);
        const collectedTiles = new Set<Uint16Array>(this.state.map[checkedY][checkedX]);
        // y >> 3
        // x & 111
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

// get initial coordinates
// check surrounding tiles
// filter out tiles we've already checked
// for each tile, check if it's crossable
// if yes, store the tile
// if no, store the tile in a separate reference
// also check if the unit on it is of the same team and has Pathfinder
// if yes, lower the cost of that tile to 0
// repeat until unit range reaches 0

export default MovementSystem;
