import GameState from "./state";

function getSurroundings(map: GameState["map"], y: number, x: number, checkedTiles: Set<Uint16Array>) {
    const allowedTiles = new Set<Uint16Array>();
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

    return allowedTiles;
}

export default getSurroundings;
