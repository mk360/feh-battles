import { afterEach, describe, it } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import assert from "node:assert";
import blankKit from "../utils/blank-kit";
import TEAM_IDS from "../constants/teamIds";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import collectCombatMods from "../../systems/collect-combat-mods";
import { applyMapComponent } from "../../systems/apply-map-effect";
import killUnits from "../utils/kill-units";

describe("Weapons in T", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Tactical Bolt", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            weapon: `Tactical Bolt`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Innes: Regal Strategician",
            weapon: "Nidhogg",
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
        assert.equal(getAttackerAdvantage(unit, enemy), 0.2);
    });

    it("Tactical Gale", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            weapon: `Tactical Gale`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Innes: Regal Strategician",
            weapon: "Nidhogg",
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
        assert.equal(getAttackerAdvantage(unit, enemy), 0.2);
    });

    it("Tharja's Hex", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Tharja: Dark Shadow",
            weapon: "Tharja's Hex",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        applyMapComponent(unit, "MapBuff", {
            atk: 6,
            def: 6
        }, unit);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Raigh: Dark Child",
            weapon: "Tharja's Hex",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[1], 1);

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
        const combatBuffs = collectCombatMods(unit);
        assert.equal(combatBuffs.atk, 12);
    });

    for (let grade of ["", "+"]) {
        it(`Tomato Tome${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Leo: Sorcerous Prince",
                weapon: `Tomato Tome${grade}`,
                rarity: 5,
                skills: blankKit(),
            }, TEAM_IDS[0], 1);

            const ally = TEST_GAME_WORLD.createHero({
                name: "Leo: Sorcerous Prince",
                weapon: `Brynhildr`,
                rarity: 5,
                skills: blankKit(),
            }, TEAM_IDS[0], 3);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Leo: Sorcerous Prince",
                weapon: `Brynhildr`,
                rarity: 5,
                skills: blankKit(),
            }, TEAM_IDS[1], 1);

            ally.addComponent({
                type: "Battling"
            });
            enemy.addComponent({
                type: "Battling"
            });
            ally.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");

            const mods = collectCombatMods(ally);

            assert.equal(mods.atk, 1);
            assert.equal(mods.spd, 1);
        });
    }

    it("Tome of Thoron", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Tailtiu: Thunder Noble",
            weapon: "Tome of Thoron",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[0], 1);

        unit.getOne("Stats").hp = Math.floor(unit.getOne("Stats").hp / 2) - 1;
        TEST_GAME_WORLD.runSystems("every-turn");
        assert.equal(unit.getOne("Special").cooldown, unit.getOne("Special").maxCooldown - 1);
        unit.getOne("Special").cooldown = 0;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Tailtiu: Thunder Noble",
            weapon: "Tome of Thoron",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

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
        const { atk } = unit.getOne("Stats");
        const { res } = enemy.getOne("Stats");
        TEST_GAME_WORLD.runSystems("combat");
        const damage = unit.getOne("DealDamage").getObject(true);
        assert.equal(damage.attacker.damage, atk + Math.floor(res / 2) - res + 10);
    });

    it("Tyrfing", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Seliph: Heir of Light",
            weapon: "Tyrfing",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);
        unit.getOne("Stats").hp = Math.floor(unit.getOne("Stats").hp / 2) - 1;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Seliph: Heir of Light",
            weapon: "Tyrfing",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

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
        assert(!enemy.getOne("CombatBuff"));
        assert.equal(combatMods.def, 4);
    });
});