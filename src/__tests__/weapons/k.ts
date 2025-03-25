import assert from "assert";
import { describe, it, afterEach } from "node:test";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";
import SPECIALS from "../../data/specials";
import checkBattleEffectiveness from "../../systems/effectiveness";

describe("K", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Kagero's Dart", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Kagero: Honorable Ninja",
            weapon: "Kagero's Dart",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Kagero: Honorable Ninja",
            weapon: "Kagero's Dart",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").def *= 2; // prevent her from dying

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Kagero: Honorable Ninja",
            weapon: "Kagero's Dart",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        unit.getOne("Stats").atk++;

        unit.addComponent({
            type: "InitiateCombat",
        });
        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const combatBuffs = collectCombatMods(unit);
        assert(!enemy.getOne("CombatBuff"));
        assert.equal(combatBuffs.atk, 4);
        assert.equal(combatBuffs.spd, 4);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const { debuffs } = collectMapMods(unit);
        assert.equal(debuffs.def, -7);
        assert.equal(debuffs.res, -7);
        assert(enemy.getOne("MapDebuff"));
        assert(enemyAlly.getOne("MapDebuff"));
    });

    for (let grade of ["", "+"]) {
        it(`Killer Axe${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Hector: General of Ostia",
                weapon: `Killer Axe${grade}`,
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
        });

        it(`Killer Bow${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Clarisse: Sniper in the Dark",
                weapon: `Killer Bow${grade}`,
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
        });

        it(`Killer Lance${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Lukas: Sharp Soldier",
                weapon: `Killer Lance${grade}`,
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
        });

        it(`Killing Edge${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: `Killing Edge${grade}`,
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
        });
    }

    it("Kitty Paddle", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Gentle Nekomata",
            weapon: "Kitty Paddle",
            rarity: 5,
            skills: blankKit()
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Boey: Skillful Survivor",
            weapon: "Gronnraven+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const { debuffs } = collectMapMods(enemy);

        assert.equal(debuffs.def, -5);
        assert.equal(debuffs.res, -5);
        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Kitty Paddle+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Gentle Nekomata",
            weapon: "Kitty Paddle+",
            rarity: 5,
            skills: blankKit()
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Boey: Skillful Survivor",
            weapon: "Gronnraven+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const { debuffs } = collectMapMods(enemy);

        assert.equal(debuffs.def, -7);
        assert.equal(debuffs.res, -7);
        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Knightly Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Mathilda: Legendary Knight",
            weapon: "Knightly Lance",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[0], 1);
        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
    });
});
