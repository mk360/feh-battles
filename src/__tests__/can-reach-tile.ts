import Teams from "../data/teams";
import tileBitmasks from "../data/tile-bitmasks";
import canReachTile from "../systems/can-reach-tile";
import TEST_GAME_WORLD from "./constants/world";

describe("canReachTile", () => {
    const unit = TEST_GAME_WORLD.createHero({
        name: "Ephraim: Restoration Lord",
        weapon: "Siegmund",
        skills: {
            assist: "Swap",
            special: "Dragon Fang",
            A: "Death Blow 3",
            B: null,
            C: null,
            S: "Life and Death 1",
        },
        initialPosition: {
            x: 1,
            y: 1
        },
        rarity: 5
    }, "team1");

    it("can cross a valid tile", () => {
        const plains = new Uint16Array(1);
        const lava = new Uint16Array(1);
        plains[0] |= tileBitmasks.type.floor;
        lava[0] |= tileBitmasks.type.void;
        expect(canReachTile(unit, plains)).toEqual(true);
        expect(canReachTile(unit, lava)).toEqual(false);
    });

    it("can theoretically reach a tile if an ally is there", () => {
        const plains = new Uint16Array(1);
        plains[0] |= (tileBitmasks.occupation & Teams.team1) | tileBitmasks.type.floor;
        const otherPlains = new Uint16Array(1);
        otherPlains[0] |= (tileBitmasks.occupation & Teams.team2) | tileBitmasks.type.floor;

        expect(canReachTile(unit, plains)).toEqual(true);
        expect(canReachTile(unit, otherPlains)).toEqual(false);
    });
});