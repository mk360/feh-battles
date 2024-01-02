import GameWorld from "./world";
import { table } from "table";
import tileBitmasks from "./data/tile-bitmasks";
import Map1 from "./data/maps/map1.json";
import TileBitshifts from "./data/tile-bitshifts";
import chalk from "chalk";

class Debugger {
    private world: GameWorld;

    constructor(world: GameWorld) {
        this.world = world;
        // to add:
        // display the map with its tile types
        // display the map with the units
        // highlight a set of tiles
        // deconstruct and display a tile's details
    }

    decodeTile(tile: Uint16Array) {
        const tileValue = tile[0];
        const tileType = tileValue & 0b1111;
        let stringTileType = "";
        const x = (tileValue >> TileBitshifts.x) & 0b111;
        const y = (tileValue >> TileBitshifts.y) & 0b111;

        for (let i in tileBitmasks.type) {
            if (tileBitmasks.type[i] === tileType) {
                stringTileType = i[0].toUpperCase();
                break;
            }
        }

        if (tileValue >> TileBitshifts.defensiveTile) {
            stringTileType += "D";
        }

        if (tileValue >> TileBitshifts.trench) {
            stringTileType += "T";
        }

        return {
            type: stringTileType,
            x,
            y
        };
    }

    drawMap(options: { includeUnits: boolean, highlightTiles: Set<Uint16Array> }) {
        const headers = ["Y / X", 1, 2, 3, 4, 5, 6];
        const rows: string[][] = [
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            []
        ];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 6; x++) {
                const tile = this.world.state.map[y + 1][x + 1] as Uint16Array;
                const decoded = this.decodeTile(tile);
                const formattedDecodedType = options.highlightTiles.has(tile) ? chalk.bgBlue("  " + decoded.type + "  ") : "  " + decoded.type + "  ";
                rows[y].push(formattedDecodedType);
            }
        }

        const withHeaders = [headers, ...rows];
        for (let i = 1; i <= 8; i++) {
            withHeaders[i].unshift(i);
        }

        console.log(table(withHeaders));
    }
};

export default Debugger;
