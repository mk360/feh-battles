import { Entity } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";

/**
 * Checks if specified entity can reach a tile. This check is true if the tile type is not unpassable (e.g. infantry and everything except void) and is not occupied by an enemy.
 * Pass `true` to the last argument to bypass enemy checking.
 */
function canReachTile(hero: Entity, tile: Uint16Array, onlyCheckTileType = false) {
    const { bitfield } = hero.getOne("MovementType");
    const { bitfield: sideBitfield } = hero.getOne("Side");
    const tileIsEmpty = (tile[0] & tileBitmasks.occupation) === 0;
    const tileHasAlly = (tile[0] & tileBitmasks.occupation) === sideBitfield;
    const canPass = !!hero.getOne("Pass");
    const occupationValidity = onlyCheckTileType ? Boolean(tile[0] & bitfield) : (tileIsEmpty || tileHasAlly || canPass) && Boolean(tile[0] & bitfield);
    return occupationValidity;
};

export default canReachTile;
