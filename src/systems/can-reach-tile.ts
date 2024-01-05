import { Entity } from "ape-ecs";
import tileBitmasks from "../data/tile-bitmasks";
import MovementTypes from "../data/movement-types";
import TileBitshifts from "../data/tile-bitshifts";

function canReachTile(hero: Entity, tile: Uint16Array) {
    const { bitfield } = hero.getOne("MovementType");
    const { bitfield: sideBitfield } = hero.getOne("Side");
    const tileIsEmpty = (tile[0] & tileBitmasks.occupation) === 0;
    const tileHasAlly = (tile[0] & tileBitmasks.occupation) === sideBitfield;
    if (bitfield === MovementTypes.cavalry.bitfield && tile[0] >> TileBitshifts.trench) {
        const { x, y } = hero.getOne("Position");
        const tileX = (tile[0] >> TileBitshifts.x) & 0b111;
        const tileY = (tile[0] >> TileBitshifts.y) & 0b111;

        return (Math.abs(tileX - x) + Math.abs(tileY - y)) === 1;
    }
    return (tileIsEmpty || tileHasAlly) && Boolean(tile[0] & bitfield);
};

export default canReachTile;
