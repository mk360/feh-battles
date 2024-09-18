import { Entity } from "ape-ecs";
/**
 * Checks if specified entity can reach a tile. This check is true if the tile type is not unpassable (e.g. infantry and everything except void) and is not occupied by an enemy.
 * Pass `true` to the last argument to bypass enemy checking.
 */
declare function canReachTile(hero: Entity, tile: Uint16Array, onlyCheckTileType?: boolean): boolean;
export default canReachTile;
//# sourceMappingURL=can-reach-tile.d.ts.map