import tileBitmasks from "../data/tile-bitmasks";
import GameState from "./state";

function getSurroundings(map: GameState["map"], y: number, x: number, checkedTiles: Set<Uint16Array>, sideBitfield: number, mvtBitfield: number) {
    const allowedTiles = new Set<Uint16Array>();
    if (checkedTiles.has(map[y][x])) return allowedTiles;
    allowedTiles.add(map[y][x]);
    if (map[y - 1] && map[y - 1][x]) {
        allowedTiles.add(map[y - 1][x]);
    }

    if (map[y][x - 1] && !checkedTiles.has(map[y][x - 1])) {
        allowedTiles.add(map[y][x - 1]);
    }

    if (map[y][x + 1] && !checkedTiles.has(map[y][x + 1])) {
        allowedTiles.add(map[y][x + 1]);
    }

    if (map[y + 1] && map[y + 1][x] && !checkedTiles.has(map[y + 1][x])) {
        allowedTiles.add(map[y + 1][x]);
    }

    const tilesWithoutEnemies = Array.from(allowedTiles).filter((uint16) => {
        return (uint16[0] & sideBitfield) || ((uint16[0] >> tileBitmasks.occupation & 0b11) === 0);
    });

    const validTiles = tilesWithoutEnemies.filter((uint16) => {
        return uint16[0] & mvtBitfield;
    });

    return new Set([...validTiles]);
}

export default getSurroundings;
