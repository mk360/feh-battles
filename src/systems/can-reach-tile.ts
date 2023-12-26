import { Entity } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";

function canReachTile(hero: Entity, tile: Uint16Array) {
    const { bitfield } = hero.getOne("MovementType");
    const { bitfield: sideBitfield } = hero.getOne("Side");
    const tileIsEmpty = (tile[0] & tileBitmasks.occupation) === 0;
    const tileHasAlly = (tile[0] & tileBitmasks.occupation) === sideBitfield;
    return (tileIsEmpty || tileHasAlly) && Boolean(tile[0] & bitfield);
};

export default canReachTile;
