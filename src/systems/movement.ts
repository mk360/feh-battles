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
import getDistance from "./get-distance";
import ASSISTS from "../data/assists";

function findCommonInSets(set1: Uint16Array[], set2: Uint16Array[]) {
    const setElements: {
        [k: number]: number
    } = {};
    const commonSet: Uint16Array[] = [];
    set1.forEach((item) => {
        setElements[item[0]] = item[0];
    });

    set2.forEach((item) => {
        if (setElements[item[0]]) commonSet.push(item);
    });

    return commonSet;
}

class MovementSystem extends System {
    private state: GameState;
    private movableQuery: Query;

    init(state: GameState): void {
        this.state = state;
        this.movableQuery = this.createQuery().fromAll("Movable");
    }

    update() {
        this.movableQuery.refresh();
        const [unit] = this.movableQuery.execute();
        const { x, y } = unit.getOne("Position");
        const allies = getAllies(this.state, unit);
        const obstructors = getEnemies(this.state, unit);

        const { skillMap } = this.state;

        const pathfinders = allies.filter((ally) => ally.getOne("Pathfinder")).map((pathfinder) => {
            const { x, y } = pathfinder.getOne("Position");
            return this.state.map[y][x];
        }) as Uint16Array[];

        const movementTiles = this.getMovementTiles(unit, this.state.map[y][x], pathfinders);

        if (!unit.getOne("Pass")) {
            for (let obstructor of obstructors) {
                if (this.state.skillMap.get(obstructor)?.onTurnEnemyCheckRange) {
                    for (let skill of skillMap.get(obstructor).onTurnEnemyCheckRange) {
                        const skillData = PASSIVES[skill.name];
                        skillData.onTurnEnemyCheckRange.call(skill, this.state, unit);
                    }
                }
            }
        }

        const blockedTiles = unit.getComponents("Obstruct");
        blockedTiles.forEach(({ x, y }) => {
            const mapTile = this.state.map[y][x];
            movementTiles.delete(mapTile);
        });

        movementTiles.forEach((tile) => {
            const { x, y } = getTileCoordinates(tile);
            unit.addComponent({
                type: "MovementTile",
                x,
                y
            });
        });

        for (let ally of allies) {
            if (skillMap.get(ally).onTurnAllyCheckRange) {
                for (let skill of this.state.skillMap.get(ally).onTurnAllyCheckRange) {
                    const skillData = PASSIVES[skill.name];
                    skillData.onTurnAllyCheckRange.call(skill, this.state, unit);
                }
            }
        }

        const warpTiles = unit.getComponents("WarpTile");
        const warpTileData = new Set<Uint16Array>();
        warpTiles.forEach((tile) => {
            if (tile) {
                const mapTile = this.state.map[tile.y][tile.x];
                if (movementTiles.has(mapTile)) {
                    unit.removeComponent(tile);
                } else {
                    warpTileData.add(mapTile);
                }
            }
        });

        const attackTiles = new Set<Uint16Array>();

        movementTiles.forEach((tile) => {
            const { x, y } = getTileCoordinates(tile);
            const mapTile = this.state.map[y][x];
            const existingUnit = this.state.occupiedTilesMap.get(mapTile);
            if (existingUnit && existingUnit.id !== unit.id || warpTileData.has(mapTile)) {
                return;
            }
            const collectedAttackTiles = this.computeFixedRange({ x, y }, movementTiles, unit.getOne("Weapon").range, false);
            collectedAttackTiles.forEach((tile) => {
                attackTiles.add(tile);
            });

        });

        warpTileData.forEach((tile) => {
            const { x, y } = getTileCoordinates(tile);
            const mapTile = this.state.map[y][x];
            const existingUnit = this.state.occupiedTilesMap.get(mapTile);
            if (existingUnit && existingUnit.id !== unit.id || movementTiles.has(mapTile)) {
                return;
            }
            const collectedAttackTiles = this.computeFixedRange({ x, y }, movementTiles, unit.getOne("Weapon").range, true);
            collectedAttackTiles.forEach((tile) => {
                attackTiles.add(tile);
            });
        });

        attackTiles.forEach((t) => {
            const { x, y } = getTileCoordinates(t);
            const occupation = this.state.map[y][x][0] & tileBitmasks.occupation;
            if (occupation && occupation !== unit.getOne("Side").bitfield) { // there's an enemy
                unit.addComponent({
                    type: "TargetableTile",
                    x,
                    y
                });
            } else {
                unit.addComponent({
                    type: "AttackTile",
                    x,
                    y
                });
            }
        });

        const assist = unit.getOne("Assist");

        if (assist) {
            const arrayedMovementTiles = Array.from(movementTiles).concat(Array.from(warpTileData));
            const { range } = assist;
            const assistData = ASSISTS[assist.name];

            for (let ally of allies) {
                const pos = ally.getOne("Position");
                const { x, y } = pos;
                const setWithPosition = new Set<Uint16Array>();
                setWithPosition.add(this.state.map[y][x]);
                const tilesSurroundingAlly = Array.from(this.computeFixedRange({ x, y }, setWithPosition, range, false));
                const tilesOccupiableByUnit = findCommonInSets(tilesSurroundingAlly, arrayedMovementTiles).filter((tile) => {
                    const eligible = canReachTile(unit, tile);
                    const occupier = this.state.occupiedTilesMap.get(tile);
                    const occupied = occupier ? occupier.id !== unit.id : false;
                    const coords = getTileCoordinates(tile);
                    const canApply = assistData.canApply.call(assist, this.state, ally, coords);

                    return eligible && !occupied && canApply;
                });

                if (tilesOccupiableByUnit.length) {
                    unit.addComponent({
                        type: "AssistTile",
                        x,
                        y
                    });
                }
            }
        }
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

        if ((tileBitfield & (1 << TileBitshifts.trench)) && movementType.value === "cavalry") {
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

        const surroundings = getSurroundings(this.state.map, checkedY, checkedX, tiles);

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

    computeFixedRange({ x, y }: { x: number, y: number }, movementTiles: Set<Uint16Array>, attackRange: number, isWarp: boolean) {
        // il va falloir debug la fonction quand l'unité a une portée de 2
        const tiles = new Set<Uint16Array>();
        let temporaryTiles = new Set<Uint16Array>().add(this.state.map[y][x]);
        let surroundings = getSurroundings(this.state.map, y, x, movementTiles);
        if (attackRange === 1) surroundings = surroundings.filter((tile) => !movementTiles.has(tile));
        const targetSet = attackRange === 1 ? tiles : temporaryTiles;

        for (let surroundingTile of surroundings) {
            targetSet.add(surroundingTile);
        }

        if (attackRange - 1) {
            temporaryTiles.forEach((temp) => {
                const { x: tX, y: tY } = getTileCoordinates(temp);
                const surroundings = getSurroundings(this.state.map, tY, tX, movementTiles).filter((t) => !movementTiles.has(t));
                for (let z of surroundings) {
                    tiles.add(z);
                }
            });
        }

        if (isWarp) {
            tiles.forEach((tile) => {
                const distance = getDistance(getTileCoordinates(tile), { x, y });
                if (distance !== attackRange) {
                    tiles.delete(tile);
                }
            });
        }

        return tiles;
    }

    getFinalMovementRange(unit: Entity): number {
        if (unit.getOne("Gravity")) return 1;

        if (unit.getOne("IncreasedMovement")) return unit.getOne("MovementType").range + 1;

        return unit.getOne("MovementType").range;
    }
};

export default MovementSystem;
