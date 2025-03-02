import assert from "node:assert";
import { describe, it } from "node:test";
import collectMapMods from "../../systems/collect-map-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import getSurroundings from "../../systems/get-surroundings";

describe("Nóatún", () => {
    it("should allow unit to teleport near an ally", () => {
        TEST_GAME_WORLD.state.currentSide = TEAM_IDS[0];
        const anna = TEST_GAME_WORLD.createHero({
            name: "Anna: Commander",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Nóatún",
        }, TEAM_IDS[0], 1);

        anna.getOne("Stats").hp = 1;

        const ally = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Falchion (Awakening)",
        }, TEAM_IDS[0], 2);

        TEST_GAME_WORLD.moveUnit(ally.id, {
            x: anna.getOne("Position").x,
            y: anna.getOne("Position").y + 4,
        }, false);

        const movement = TEST_GAME_WORLD.getUnitMovement(anna.id);
        const warpTiles = Array.from(movement.warpTiles).map((comp) => {
            return TEST_GAME_WORLD.state.map[comp.y][comp.x];
        });

        const allyCoordinates = ally.getOne("Position");

        const surroundings = getSurroundings(TEST_GAME_WORLD.state.map, allyCoordinates.y, allyCoordinates.x).filter((t) => {
            return t !== TEST_GAME_WORLD.state.map[allyCoordinates.y][allyCoordinates.x];
        });
        assert.equal(warpTiles.length, surroundings.length);

        for (let tile of surroundings) {
            assert(warpTiles.includes(tile));
        }

        anna.addComponent({
            type: "Kill"
        });
        ally.addComponent({
            type: "Kill"
        });
        TEST_GAME_WORLD.runSystems("kill");
    });
});