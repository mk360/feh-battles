import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import { applyMapComponent } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("O", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Oboro's Spear", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Oboro: Fierce Fighter",
            weapon: "Oboro's Spear",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Effie: Army of One",
            weapon: "Silver Lance+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Odin's Grimoire", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Odin: Potent Force",
            weapon: "Odin's Grimoire",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Effie: Army of One",
            weapon: "Silver Lance+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "Battling"
        });

        applyMapComponent(unit, "MapBuff", {
            atk: 6,
            def: 6
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const buffs = collectCombatMods(unit);
        assert.equal(buffs.atk, 12);
    });
});