import { after, describe, it } from "node:test";
import assert from "node:assert";
import Teams from "../data/teams";
import tileBitmasks from "../data/tile-bitmasks";
import canReachTile from "../systems/can-reach-tile";
import TEST_GAME_WORLD from "./constants/world";
import killUnits from "./utils/kill-units";

describe("canReachTile", () => {
    const unit = TEST_GAME_WORLD.createHero({
        name: "Ephraim: Restoration Lord",
        weapon: "Siegmund",
        skills: {
            assist: "Swap",
            special: "Dragon Fang",
            A: "Death Blow 3",
            B: "",
            C: "",
            S: "Life and Death 1",
        },
        rarity: 5
    }, TEST_GAME_WORLD.state.teamIds[0], 1);

    after(() => killUnits([unit]));

    it("can cross a valid tile", () => {
        const plains = new Uint16Array(1);
        const lava = new Uint16Array(1);
        plains[0] |= tileBitmasks.type.ground;
        lava[0] |= tileBitmasks.type.void;
        assert.strictEqual(canReachTile(unit, plains), true);
        assert.strictEqual(canReachTile(unit, lava), false);
    });

    it("can theoretically reach a tile if an ally is there", () => {
        const plains = new Uint16Array(1);
        plains[0] |= (tileBitmasks.occupation & Teams[0]) | tileBitmasks.type.ground;
        const otherPlains = new Uint16Array(1);
        otherPlains[0] |= (tileBitmasks.occupation & Teams[1]) | tileBitmasks.type.ground;

        assert.strictEqual(canReachTile(unit, plains), true);
        assert.strictEqual(canReachTile(unit, otherPlains), false);
    });

    it("can't cross a tile where movement type is incompatible", () => {
        const voidTile = new Uint16Array(1);
        voidTile[0] |= tileBitmasks.type.void;

        assert.strictEqual(canReachTile(unit, voidTile), false);
    });
});