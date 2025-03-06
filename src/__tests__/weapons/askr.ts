import assert from "node:assert";
import { after, describe, it } from "node:test";
import collectMapMods from "../../systems/collect-map-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";
import getSurroundings from "../../systems/get-surroundings";

describe("Askr Weapons", () => {
    it("should run Fensalir's turn start effect", () => {
        const lance = TEST_GAME_WORLD.createHero({
            name: "Sharena: Princess of Askr",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Fensalir",
        }, TEAM_IDS[0], 1);

        const enemy1 = TEST_GAME_WORLD.createHero({
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
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.state.currentSide = TEAM_IDS[0];

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: lance.getOne("Position").x + 1,
            y: lance.getOne("Position").y,
        }, false);
        TEST_GAME_WORLD.runSystems("every-turn");
        const statChanges = collectMapMods(enemy1);
        assert.equal(statChanges.debuffs.atk, -4);

        killUnits([enemy1, lance]);
    });

    it("should run Fólkvangr's turn start effect", () => {
        const sword = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Fólkvangr",
        }, TEAM_IDS[0], 1);

        sword.getOne("Stats").hp = 1;
        TEST_GAME_WORLD.runSystems("every-turn");
        const mapBuffs = collectMapMods(sword);
        assert.equal(mapBuffs.buffs.atk, 5);

        killUnits([sword]);
    });

    it("should make Nóatún teleport to an ally", () => {
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

        TEST_GAME_WORLD.state.currentSide = TEAM_IDS[0];

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

        after(() => killUnits([anna, ally]));
    });
});