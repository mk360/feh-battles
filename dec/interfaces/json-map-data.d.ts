type JSONTileType = "wall" | "forest" | "void" | "ground";
interface JSONMapData {
    tileData: JSONTileType[][];
    spawnLocations: Partial<{
        [k: string]: {
            x: number;
            y: number;
        }[];
    }>;
}
//# sourceMappingURL=json-map-data.d.ts.map