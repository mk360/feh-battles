import assert from "node:assert";
import { after, describe, it } from "node:test";
import collectMapMods from "../../systems/collect-map-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";

describe("Fensalir", () => {
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

    after(killUnits([enemy1, lance]));

    it("should run the turn start effect", () => {
        TEST_GAME_WORLD.state.currentSide = TEAM_IDS[0];

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: lance.getOne("Position").x + 1,
            y: lance.getOne("Position").y,
        }, false);
        TEST_GAME_WORLD.runSystems("every-turn");
        const statChanges = collectMapMods(enemy1);
        assert.equal(statChanges.debuffs.atk, -4);
    });
});