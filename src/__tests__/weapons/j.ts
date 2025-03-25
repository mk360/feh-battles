import assert from "assert";
import { afterEach, describe, it } from "node:test";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("J", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Jakob's Tray", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Jakob: Devoted Servant",
            rarity: 5,
            weapon: "Jakob's Tray",
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Jakob: Devoted Servant",
            rarity: 5,
            weapon: "Jakob's Tray",
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Jakob: Devoted Servant",
            rarity: 5,
            weapon: "Jakob's Tray",
            skills: blankKit(),
        }, TEAM_IDS[1], 2);

        unit.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const combatDebuffs = collectCombatMods(enemy);
        assert.equal(combatDebuffs.atk, -4);
        assert.equal(combatDebuffs.def, -4);
        assert.equal(combatDebuffs.res, -4);
        assert.equal(combatDebuffs.spd, -4);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const { debuffs } = collectMapMods(enemy);
        assert.equal(debuffs.def, -7);
        assert.equal(debuffs.res, -7);

        const { debuffs: allyDebuffs } = collectMapMods(enemyAlly);
        assert.equal(allyDebuffs.def, -7);
        assert.equal(allyDebuffs.res, -7);
    });

    it("Jubilant Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Tobin: The Clueless One",
            weapon: "Jubilant Blade",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            weapon: "Armads",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });
});
