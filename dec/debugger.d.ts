import GameWorld from "./world";
declare class Debugger {
    private world;
    constructor(world: GameWorld);
    decodeTile(tile: Uint16Array): {
        type: string;
        x: number;
        y: number;
    };
    drawMap(options: {
        includeUnits: boolean;
        highlightTiles: Set<Uint16Array>;
    }): void;
}
export default Debugger;
//# sourceMappingURL=debugger.d.ts.map