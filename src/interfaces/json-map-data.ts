type JSONTileType = "wall" | "forest" | "void" | "ground";

interface JSONMapData {
    tileData: JSONTileType[][];
    spawnLocations: {
        team1: { x: number; y: number }[];
        team2: { x: number; y: number }[];
    }
}