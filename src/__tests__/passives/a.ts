import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import WEAPONS from "../../data/weapons";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getCombatStats from "../../systems/get-combat-stats";
import getMapStats from "../../systems/get-map-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";
import blankKit from "../utils/blank-kit";
import collectCombatMods from "../../systems/collect-combat-mods";

describe("Passives in A", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    for (let level of [1, 2, 3]) {
        it(`Attack +${level}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Priscilla: Delicate Princess",
                skills: {
                    ...blankKit(),
                    A: `Attack +${level}`
                },
                rarity: 5,
                weapon: "",
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Stats").atk, level40Stats["Priscilla: Delicate Princess"].atk.standard + level);
        });
    }

    for (let otherStat of ["def", "res"]) {
        const uppercaseStat = otherStat.replace(otherStat[0], otherStat[0].toUpperCase());
        for (let level of [1, 2]) {
            it(`Attack/${uppercaseStat} ${level}`, () => {
                const unit = TEST_GAME_WORLD.createHero({
                    name: "Priscilla: Delicate Princess",
                    skills: {
                        ...blankKit(),
                        A: `Attack/${uppercaseStat} ${level}`
                    },
                    rarity: 5,
                    weapon: "",
                }, TEAM_IDS[0], 1);
                assert.equal(unit.getOne("Stats").atk, level40Stats["Priscilla: Delicate Princess"].atk.standard + level);
                assert.equal(unit.getOne("Stats")[otherStat], level40Stats["Priscilla: Delicate Princess"][otherStat].standard + level);
            });
        }
    }

    for (let level of [1, 2]) {
        it(`Atk/Spd ${level}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Priscilla: Delicate Princess",
                skills: {
                    ...blankKit(),
                    A: `Atk/Spd ${level}`
                },
                rarity: 5,
                weapon: "",
            }, TEAM_IDS[0], 1);
            assert.equal(unit.getOne("Stats").spd, level40Stats["Priscilla: Delicate Princess"].spd.standard + level);
        });
    }

    for (let stat of ["Def", "Res"] as const) {
        for (let level of [1, 2, 3]) {
            it(`Atk/${stat} Bond ${level}`, () => {
                let buff = 2 + level;

                const unit = TEST_GAME_WORLD.createHero({
                    name: "Chrom: Exalted Prince",
                    weapon: "Falchion (Awakening)",
                    skills: {
                        ...blankKit(),
                        A: `Atk/${stat} Bond ${level}`,
                    },
                    rarity: 5,
                }, TEAM_IDS[0], 1);

                const ally = TEST_GAME_WORLD.createHero({
                    name: "Chrom: Exalted Prince",
                    weapon: "Falchion (Awakening)",
                    skills: blankKit(),
                    rarity: 5,
                }, TEAM_IDS[0], 2);

                const enemy = TEST_GAME_WORLD.createHero({
                    name: "Chrom: Exalted Prince",
                    weapon: "Falchion (Awakening)",
                    skills: blankKit(),
                    rarity: 5,
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
                const { atk, def, res } = collectCombatMods(unit);

                assert.equal(atk, buff);
                if (stat === "Def") {
                    assert.equal(def, buff);
                } else {
                    assert.equal(res, buff);
                }
            });
        }
    }

    for (let level of [1, 2, 3]) {
        it(`Armored Blow ${level}`, () => {
            let buff = level * 2;
            const unit = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "Falchion (Awakening)",
                skills: {
                    ...blankKit(),
                    A: `Armored Blow ${level}`,
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "Falchion (Awakening)",
                skills: {
                    ...blankKit(),
                    A: `Armored Blow ${level}`,
                },
                rarity: 5,
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
            const { def } = collectCombatMods(unit);
            const { def: otherDef } = collectCombatMods(enemy);

            assert.equal(def, buff);
            assert.equal(otherDef, 0);
        });
    }

    for (let level of [1, 2, 3]) {
        it(`Axebreaker ${level}`, () => {
            let threshold = 90 - (level - 1) * 20;

            const unit = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "Falchion (Awakening)",
                skills: {
                    ...blankKit(),
                    B: `Axebreaker ${level}`
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            unit.getOne("Stats").hp = Math.floor(unit.getOne("Stats").maxHP * threshold / 100) + 1;

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                weapon: "Urvan",
                skills: {
                    ...blankKit(),
                    A: `Armored Blow ${level}`,
                },
                rarity: 5,
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

            assert(unit.getOne("PreventFollowup"));
            assert(unit.getOne("GuaranteedFollowup"));
        });
    }
});