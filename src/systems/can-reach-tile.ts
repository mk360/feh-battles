import { Entity } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";

/**
 * Checks if specified entity can reach a tile. This check is true if the tile type is not unpassable (e.g. infantry and everything except void) and is not occupied by an enemy.
 */
function canReachTile(hero: Entity, tile: Uint16Array) {
    const { bitfield } = hero.getOne("MovementType");
    const { bitfield: sideBitfield } = hero.getOne("Side");
    const tileIsEmpty = (tile[0] & tileBitmasks.occupation) === 0;
    const tileHasAlly = (tile[0] & tileBitmasks.occupation) === sideBitfield;
    const canPass = !!hero.getOne("Pass");
    return (tileIsEmpty || tileHasAlly || canPass) && Boolean(tile[0] & bitfield);
};

export default canReachTile;
