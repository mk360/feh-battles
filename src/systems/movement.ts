import { Entity, Query, System } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import GameState from "./state";
import canReachTile from "./can-reach-tile";
import getSurroundings from "./get-surroundings";
import PASSIVES from "../data/passives";
import TileBitshifts from "../data/tile-bitshifts";
import getTileCoordinates from "./get-tile-coordinates";
import Debugger from "../debugger";
import GameWorld from "../world";

class MovementSystem extends System {
    private state: GameState;
    private pathfinderQuery: Query;
    private movableQuery: Query;
    private obstructQuery: Query;

    init(state: GameState): void {
        this.state = state;
        this.pathfinderQuery = this.createQuery().fromAll("Pathfinder");
        this.movableQuery = this.createQuery().fromAll("Movable");
        this.obstructQuery = this.createQuery().fromAll("Obstruct");
    }

    update() {
        // this.state.tiles.getComponents("WalkTile").forEach((c) => this.state.tiles.removeComponent(c));
        // this.state.tiles.getComponents("WarpTile").forEach((c) => this.state.tiles.removeComponent(c));
        // this.state.tiles.getComponents("AttackTile").forEach((c) => this.state.tiles.removeComponent(c));
        // this.state.tiles.getComponents("AssistTile").forEach((c) => this.state.tiles.removeComponent(c));
        this.movableQuery.refresh();
        const [unit] = this.movableQuery.execute();
        // refactor: attacher les cases à l'unité plutôt qu'à une state
        const { x, y } = unit.getOne("Position");
        const allies = getAllies(this.state, unit);
        const obstructors = getEnemies(this.state, unit);
        const obstructedTiles = new Set<Uint16Array>();

        for (let ally of allies) {
            if (this.state.skillMap.get(ally).onTurnAllyCheckRange) {
                for (let skill of this.state.skillMap.get(ally).onTurnAllyCheckRange) {
                    const skillData = PASSIVES[skill.name];
                    skillData.onTurnAllyCheckRange.call(skill, this.state, unit);
                }
            }
        }

        const pathfinders = allies.filter((ally) => ally.getOne("Pathfinder")).map((pathfinder) => {
            const { x, y } = pathfinder.getOne("Position");
            return this.state.map[y][x];
        }) as Uint16Array[];

        if (!unit.getOne("Pass")) {
            for (let obstructor of obstructors) {
                if (this.state.skillMap.get(obstructor)?.onTurnAllyCheckRange) {
                    for (let skill of this.state.skillMap.get(obstructor).onTurnEnemyCheckRange) {

                    }
                }
            }
        }

        const generatedTiles = this.getMovementTiles(unit, this.state.map[y][x], pathfinders);

        generatedTiles.forEach((tile) => {
            const { x, y } = getTileCoordinates(tile);
            unit.addComponent({
                type: "MovementTile",
                x,
                y
            });
        });

        // const deb = new Debugger(this.world as GameWorld);
        // deb.drawMap({
        //     includeUnits: false,
        //     highlightTiles: generatedTiles,
        // });
    }

    getTileCost(hero: Entity, tile: Uint16Array, pathfinder: Uint16Array[]) {
        const [tileBitfield] = tile;

        if (pathfinder.includes(tile)) {
            return 0;
        }

        const movementType = hero.getOne("MovementType");
        if ((tileBitfield & 0b1111) === tileBitmasks.type.forest && movementType.value === "infantry") {
            return 2;
        }

        if ((tileBitfield >> TileBitshifts.trench) && movementType.value === "cavalry") {
            return 3;
        }

        return 1;
    }

    // thank you chatgpt
    getMovementTiles(hero: Entity, checkedTile: Uint16Array, pathfinderTiles: Uint16Array[], remainingRange?: number) {
        const finalRange = remainingRange ?? this.getFinalMovementRange(hero);
        if (!finalRange) return new Set<Uint16Array>();
        const { x: checkedX, y: checkedY } = getTileCoordinates(checkedTile);

        const tiles = new Set<Uint16Array>().add(checkedTile);

        const surroundings = getSurroundings(this.state.map, checkedY + 1, checkedX + 1, tiles);        

        const validSurroundings = surroundings.filter((tile) => {
            const canReach = canReachTile(hero, tile);
            const cost = this.getTileCost(hero, tile, pathfinderTiles);
            const canCross = cost <= finalRange;
            return canCross && canReach;
        });

        for (const nextTile of validSurroundings) {
            tiles.add(nextTile);
        }

        if (finalRange > 0) {
            for (const nextTile of validSurroundings) {
                const nextRemainingRange = finalRange - this.getTileCost(hero, nextTile, pathfinderTiles);
                const nextMovementTiles = this.getMovementTiles(hero, nextTile, pathfinderTiles, nextRemainingRange);
                nextMovementTiles.forEach((tile) => {
                    tiles.add(tile);
                });
            }
        }

        return tiles;
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
