import GameState from "./state";

function getSurroundings(map: GameState["map"], y: number, x: number, checkedTiles: Set<Uint16Array>) {
    const allowedTiles: Uint16Array[] = [];
    if (map[y] && map[y][x]) {
        allowedTiles.push(map[y][x]);
    }
    if (map[y - 1] && map[y - 1][x]) {
        allowedTiles.push(map[y - 1][x]);
    }

    if (map[y] && map[y][x - 1] && !checkedTiles.has(map[y][x - 1])) {
        allowedTiles.push(map[y][x - 1]);
    }

    if (map[y] && map[y][x + 1] && !checkedTiles.has(map[y][x + 1])) {
        allowedTiles.push(map[y][x + 1]);
    }

    if (map[y + 1] && map[y + 1][x] && !checkedTiles.has(map[y + 1][x])) {
        allowedTiles.push(map[y + 1][x]);
    }

    return allowedTiles;
}

export default getSurroundings;
