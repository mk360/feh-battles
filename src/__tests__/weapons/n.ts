import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import collectCombatMods from "../../systems/collect-combat-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("Weapons in N", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Naga", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const otherEnemy = TEST_GAME_WORLD.createHero({
            name: "Tiki: Dragon Scion",
            weapon: "Flametongue+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

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
        const buffs = collectCombatMods(enemy);
        assert.equal(buffs.def, 2);
        assert.equal(buffs.res, 2);

        assert(checkBattleEffectiveness(unit, otherEnemy));
    });

    it("Nidhogg", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Innes: Regal Strategician",
            weapon: "Nidhogg",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const { x, y } = unit.getOne("Position");

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
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
        const combatBuffs = collectCombatMods(unit);
        assert.equal(combatBuffs.atk, 2);
        assert.equal(combatBuffs.def, 2);
        assert.equal(combatBuffs.res, 2);
        assert.equal(combatBuffs.spd, 2);
        TEST_GAME_WORLD.runSystems("after-combat");

        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x,
            y: y + 1
        }, false);

        TEST_GAME_WORLD.runSystems("before-combat");
        const otherCombatBuffs = collectCombatMods(unit);
        assert.equal(otherCombatBuffs.atk, 4);
        assert.equal(otherCombatBuffs.def, 4);
        assert.equal(otherCombatBuffs.res, 4);
        assert.equal(otherCombatBuffs.spd, 4);
    });

    it("Niles's Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Niles: Cruel to Be Kind",
            weapon: "Niles's Bow",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").def = 99;

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
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = unit.getOne("DealDamage");
        assert.equal(dealDamage.attacker.damage, 7);
        TEST_GAME_WORLD.runSystems("after-combat");
    });
});