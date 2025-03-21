import assert from "assert";
import { describe, afterEach, it } from "node:test";
import killUnits from "../utils/kill-units";
import TEST_GAME_WORLD from "../constants/world";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import TEAM_IDS from "../constants/teamIds";
import blankKit from "../utils/blank-kit";
import { applyMapComponent, removeStatuses } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";

describe("I", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });
    it("Inscribed Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Boey: Skillful Survivor",
            skills: blankKit(),
            weapon: "Inscribed Tome",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 4);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Eliwood: Knight of Lycia",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getAttackerAdvantage(unit, enemy), 0.2);
        assert.equal(getAttackerAdvantage(enemy, unit), -0.2);
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(getAttackerAdvantage(unit, enemy2), -0.2);
        assert.equal(getAttackerAdvantage(enemy2, unit), 0.2);
    });

    it("Inveterate Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gunter: Inveterate Soldier",
            skills: blankKit(),
            weapon: "Inveterate Axe",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Eliwood: Knight of Lycia",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy2.getOne("Stats").spd = enemy.getOne("Stats").spd;

        TEST_GAME_WORLD.runSystems("every-turn");

        assert(enemy.getOne("MapDebuff"));
        assert(enemy2.getOne("MapDebuff"));
        const debuff = enemy.getOne("MapDebuff");
        assert.equal(debuff.atk, -5);
        assert.equal(debuff.def, -5);
        removeStatuses(enemy, "Penalty");
        removeStatuses(enemy2, "Penalty");
        enemy2.getOne("Stats").spd++;

        TEST_GAME_WORLD.runSystems("every-turn");
        assert(!enemy2.getOne("MapDebuff"));
        assert(enemy.getOne("MapDebuff"));
    });

    it("Iris's Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Nino: Pious Mage",
            weapon: "Iris's Tome",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: `Iron Sword`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        applyMapComponent(unit, "MapBuff", {
            atk: 5,
            spd: 5,
            def: 0,
            res: 0
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const mapMods = collectCombatMods(unit);
        assert.equal(mapMods.atk, 10);
        TEST_GAME_WORLD.runSystems("after-combat");
    });
});