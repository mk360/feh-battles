import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import collectCombatMods from "../../systems/collect-combat-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("V", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Valflame", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Arvis: Emperor of Flame",
            weapon: "Valflame",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        enemy.getOne("Position").y = unit.getOne("Position").y;
        enemy2.getOne("Position").x = unit.getOne("Position").x;
        enemy2.getOne("Stats").res = unit.getOne("Stats").res + 1;

        TEST_GAME_WORLD.runSystems("every-turn");

        assert(!enemy2.getOne("MapDebuff"));
        const enemyDebuff = enemy.getOne("MapDebuff");
        assert.equal(enemyDebuff.atk, -4);
        assert.equal(enemyDebuff.res, -4);
    });

    it("Veteran Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Jagen: Veteran Knight",
            weapon: "Veteran Lance",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Jagen: Veteran Knight",
            weapon: "Veteran Lance",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 3);

        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        const combatMods = collectCombatMods(unit);
        const enemyMods = collectCombatMods(enemy);
        assert.equal(combatMods.atk, enemyMods.atk);
        assert.equal(combatMods.res, enemyMods.res);
        assert.equal(combatMods.res, 5);
        assert.equal(combatMods.atk, 5);
    });

    it("Vidofnir", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Jagen: Veteran Knight",
            weapon: "Veteran Lance",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Tana: Winged Princess",
            weapon: "Vidofnir",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 3);

        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        const combatMods = collectCombatMods(enemy);
        assert.equal(combatMods.def, 7);
    });
});