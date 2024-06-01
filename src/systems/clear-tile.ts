import TileBitshifts from "../data/tile-bitshifts";

function clearTile(tile: Uint16Array) {
    const blankBitmap = new Uint16Array(1);
    blankBitmap[0] = -1;
    const bitArray = blankBitmap[0].toString(2).split("");
    bitArray[bitArray.length - TileBitshifts.occupation1 - 1] = "0";
    bitArray[bitArray.length - TileBitshifts.occupation2 - 1] = "0";
    const newBinaryMap = +`0b${bitArray.join("")}`;
    tile[0] &= newBinaryMap;
};

export default clearTile;
