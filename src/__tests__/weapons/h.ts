import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import { applyMapComponent } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getCombatStats from "../../systems/get-combat-stats";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("H", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });
    for (let grade of ["", "+"]) {
        it(`Hammer${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Frederick: Polite Knight",
                weapon: `Hammer${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[1], 1);

            assert(checkBattleEffectiveness(unit, enemy));
        });
    }

    it("Hauteclere", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Michalis: Ambitious King",
            weapon: "Hauteclere",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });

    it("Hana's Katana", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Hana: Focused Samurai",
            weapon: "Hana's Katana",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    for (let grade of ["", "+"]) {
        it(`Heavy Spear${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Oboro: Fierce Fighter",
                weapon: `Heavy Spear${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[1], 1);

            assert(checkBattleEffectiveness(unit, enemy));
        });
    }

    it("Hermit's Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Raigh: Dark Child",
            skills: blankKit(),
            rarity: 5,
            weapon: "Hermit's Tome"
        }, TEAM_IDS[0], 1);

        const lanceEnemy = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            skills: blankKit(),
            rarity: 5,
            weapon: "Gradivus"
        }, TEAM_IDS[1], 1);

        const magicEnemy = TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            skills: blankKit(),
            rarity: 5,
            weapon: "Forblaze"
        }, TEAM_IDS[1], 2);

        applyMapComponent(magicEnemy, "MapBuff", {
            atk: 6,
            res: 6
        }, magicEnemy);

        assert(checkBattleEffectiveness(unit, lanceEnemy));

        unit.addComponent({
            type: "InitiateCombat"
        });

        magicEnemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const combatMods = collectCombatMods(magicEnemy);
        assert.equal(combatMods.atk, -6);
        assert.equal(combatMods.res, -6);
    });

    it("Hewn Lance", () => {
        const lanceUnit = TEST_GAME_WORLD.createHero({
            name: "Donnel: Village Hero",
            skills: blankKit(),
            weapon: "Hewn Lance",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Donnel: Village Hero",
            weapon: "Hewn Lance",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;

        lanceUnit.addComponent({
            type: "InitiateCombat"
        });

        lanceUnit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert(lanceUnit.getOne("BraveWeapon"));
        assert(!enemy.getOne("BraveWeapon"));
        const turns = generateTurns(lanceUnit, enemy);
        assert.equal(turns[0], lanceUnit);
        assert.equal(turns[1], lanceUnit);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    for (let grade of ["", "+"]) {
        it(`Hibiscus Tome${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Elise: Tropical Flower",
                skills: blankKit(),
                rarity: 5,
                weapon: `Hibiscus Tome${grade}`
            }, TEAM_IDS[0], 1);

            const ally = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                skills: blankKit(),
                rarity: 5,
                weapon: "Falchion (Awakening)"
            }, TEAM_IDS[0], 2);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Zephiel: The Liberator",
                rarity: 5,
                skills: blankKit(),
                weapon: "Eckesachs"
            }, TEAM_IDS[1], 1);

            ally.addComponent({
                type: "Battling"
            });

            ally.addComponent({
                type: "InitiateCombat"
            });

            enemy.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");

            const mods = collectCombatMods(ally);
            assert.equal(mods.atk, 1);
            assert.equal(mods.spd, 1);
        });
    }

    it("Hinata's Katana", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Hinata: Wild Samurai",
            skills: blankKit(),
            rarity: 5,
            weapon: "Hinata's Katana"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            rarity: 5,
            skills: blankKit(),
            weapon: "Eckesachs"
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        const mods = collectCombatMods(unit);
        assert.equal(mods.atk, 4);
        assert.equal(mods.def, 4);
    });

    it("Hinoka's Spear", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Hinoka: Warrior Princess",
            skills: blankKit(),
            rarity: 5,
            weapon: "Hinoka's Spear"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            rarity: 5,
            skills: blankKit(),
            weapon: "Eckesachs"
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        const ally = TEST_GAME_WORLD.createHero({
            name: "Hinoka: Warrior Princess",
            skills: blankKit(),
            rarity: 5,
            weapon: "Hinoka's Spear"
        }, TEAM_IDS[0], 2);

        TEST_GAME_WORLD.runSystems("before-combat");
        const mods = collectCombatMods(unit);
        assert.equal(mods.atk, 4);
        assert.equal(mods.spd, 4);
        TEST_GAME_WORLD.runSystems("after-combat");
        TEST_GAME_WORLD.moveUnit(ally.id, {
            x: unit.getOne("Position").x + 4,
            y: unit.getOne("Position").y + 4,
        }, false);

        TEST_GAME_WORLD.runSystems("before-combat");
        assert(!unit.getOne("CombatBuff"));
    });
});