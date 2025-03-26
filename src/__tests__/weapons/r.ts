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
import getAffinity from "../../systems/get-affinity";
import collectMapMods from "../../systems/collect-map-mods";
import generateTurns from "../../systems/generate-turns";
import getCombatStats from "../../systems/get-combat-stats";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";

describe("R", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Ragnarok", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Celica: Caring Princess",
            rarity: 5,
            weapon: "Ragnarok",
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Celica: Caring Princess",
            rarity: 5,
            weapon: "Ragnarok",
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").hp--;
        enemy.getOne("Stats").atk = 0;

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
        const combatBuff = collectCombatMods(unit);
        assert.equal(combatBuff.atk, 5);
        assert.equal(combatBuff.spd, 5);
        TEST_GAME_WORLD.runSystems("combat");
        const attackerHP = unit.getOne("Stats").hp;
        const defenderHP = enemy.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(defenderHP, enemy.getOne("Stats").hp);
        assert.equal(unit.getOne("Stats").hp, attackerHP - 5);
        assert(unit.getOne("MapDebuff"));
        assert(enemy.getOne("MapDebuff"));
    });

    it("Ragnell", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Ike: Young Mercenary",
            weapon: "Ragnell",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            weapon: "Forblaze",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "InitiateCombat"
        });
        enemy.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const turns = generateTurns(enemy, unit);
        assert(turns.includes(unit));
    });

    it("Raijinto", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Ryoma: Peerless Samurai",
            weapon: "Raijinto",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            weapon: "Forblaze",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "InitiateCombat"
        });
        enemy.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const turns = generateTurns(enemy, unit);
        assert(turns.includes(unit));
    });

    for (let grade of ["", "+"]) {
        it(`Rauðrblade${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Raigh: Dark Child",
                weapon: `Rauðrblade${grade}`,
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown + 1);

            applyMapComponent(unit, "MapBuff", {
                atk: 6,
                def: 6
            }, unit);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Raigh: Dark Child",
                weapon: `Rauðrblade${grade}`,
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

        it(`Rauðrowl${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Raigh: Dark Child",
                weapon: `Rauðrowl${grade}`,
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

        it(`Rauðrraven${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Raigh: Dark Child",
                weapon: `Rauðrraven${grade}`,
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
    }
});