import { afterEach, describe, it } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";
import TEAM_IDS from "../constants/teamIds";
import level40Stats from "../constants/lv40_stats.json";
import assert from "assert";
import collectMapMods from "../../systems/collect-map-mods";

describe("E", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Eckesachs", () => {
        const zephiel = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "Eckesachs",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const pos = zephiel.getOne("Position");

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: pos.x + 1,
            y: pos.y
        }, false);

        TEST_GAME_WORLD.moveUnit(enemy2.id, {
            x: pos.x,
            y: pos.y + 4
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        const mapMods = collectMapMods(enemy1);

        assert(!enemy2.getOne("MapDebuff"));
        assert.equal(mapMods.debuffs.def, -4);
    });

    it("Elena's Staff", () => {
        const mist = TEST_GAME_WORLD.createHero({
            name: "Mist: Helpful Sister",
            weapon: "Elena's Staff",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const pos = mist.getOne("Position");

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: pos.x + 3,
            y: pos.y + 1,
        }, false);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(enemy2.id, {
            x: pos.x + 3,
            y: pos.y + 2,
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        const debuff = collectMapMods(enemy1);

        assert.equal(debuff.debuffs.atk, -7);
        assert.equal(debuff.debuffs.spd, -7);
        assert(!enemy2.getOne("MapDebuff"));

        assert.equal(mist.getOne("Stats").res, level40Stats["Mist: Helpful Sister"].res.standard + 3);
    });
});