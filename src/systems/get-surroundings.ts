import tileBitmasks from "../data/tile-bitmasks";
import GameState from "./state";

function getSurroundings(map: GameState["map"], y: number, x: number, checkedTiles: Set<Uint16Array>, sideBitfield: number, mvtBitfield: number) {
    if (checkedTiles.has(map[y][x])) return [];
    const arr: Uint16Array[] = [map[y][x]];
    if (map[y - 1] && map[y - 1][x]) {
        checkedTiles.add(map[y - 1][x]);
        arr.push(map[y - 1][x]);
    }

    if (map[y][x - 1] && !checkedTiles.has(map[y][x - 1])) {
        checkedTiles.add(map[y][x - 1]);
        arr.push(map[y][x - 1]);
    }

    if (map[y][x + 1] && !checkedTiles.has(map[y][x + 1])) {
        checkedTiles.add(map[y][x + 1]);
        arr.push(map[y][x + 1]);
    }

    if (map[y + 1] && map[y + 1][x] && !checkedTiles.has(map[y + 1][x])) {
        checkedTiles.add(map[y + 1][x]);
        arr.push(map[y + 1][x]);
    }

    const tilesWithoutEnemies = arr.filter((uint8) => {
        return (uint8[0] & sideBitfield) || ((uint8[0] >> tileBitmasks.occupation & 0b11) === 0);
    });

    const validTiles = tilesWithoutEnemies.filter((uint8) => {
        return uint8[0] & mvtBitfield;
    });

    return validTiles;
}

export default getSurroundings;
