import TileBitshifts from "../data/tile-bitshifts";

function getTileCoordinates(tile: Uint16Array) {
    const tileValue = tile[0];
    const x = (tileValue >> TileBitshifts.x) & 0b111;
    const y = (tileValue >> TileBitshifts.y) & 0b111;

    return {
        x,
        y
    };
};

export default getTileCoordinates;
