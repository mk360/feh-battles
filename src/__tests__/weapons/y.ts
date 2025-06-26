import { afterEach, describe, it } from "node:test";
import killUnits from "../utils/kill-units";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import TEAM_IDS from "../constants/teamIds";
import assert from "node:assert";
import collectCombatMods from "../../systems/collect-combat-mods";

describe("W", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Yato", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Prince",
            weapon: "Yato",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Prince",
            weapon: "Yato",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        assert(!enemy.getOne("CombatBuff"));
        const { spd } = collectCombatMods(unit);
        assert.equal(spd, 4);
    });
});