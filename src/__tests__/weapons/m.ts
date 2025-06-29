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

describe("Weapons in M", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    for (let grade of ["", "+"]) {
        it(`Melon Crusher${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Tiki: Summering Scion",
                weapon: `Melon Crusher${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Ursula: Blue Crow",
                weapon: "Thunder",
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
            const buffs = collectCombatMods(unit);
            assert.equal(buffs.atk, 2);
            assert.equal(buffs.spd, 2);
            assert.equal(buffs.def, 2);
            assert.equal(buffs.res, 2);
            const hp = unit.getOne("Stats").hp;
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");
            assert.equal(unit.getOne("Stats").hp, hp - 2);
        });

        it(`Monstrous Bow${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Innes: Regal Strategician",
                weapon: `Monstrous Bow${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Hinoka: Warrior Princess",
                weapon: "Brave Lance+",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            const enemyAlly = TEST_GAME_WORLD.createHero({
                name: "Ursula: Blue Crow",
                weapon: "Thunder",
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

            assert(checkBattleEffectiveness(unit, enemy));
            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");
            assert(enemyAlly.getOne("PanicComponent"));
        });
    }

    it("Mulagir", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lyn: Brave Lady",
            weapon: "Mulagir",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lute: Prodigy",
            weapon: "Weirding Tome",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        assert.equal(unit.getOne("Stats").spd, level40Stats["Lyn: Brave Lady"].spd.standard + 3);

        unit.addComponent({
            type: "InitiateCombat"
        });
        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        applyMapComponent(enemy, "MapBuff", {
            atk: 6,
            spd: 6
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const changes = collectCombatMods(enemy);
        assert.equal(changes.atk, -6);
        assert.equal(changes.spd, -6);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Mystletainn", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Eldigan: Lionheart",
            weapon: "Mystletainn",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
    });
});