import { describe, it } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import TEAM_IDS from "../constants/teamIds";
import assert from "node:assert";
import killUnits from "../utils/kill-units";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import generateTurns from "../../systems/generate-turns";

describe("C", () => {
    it("Camilla's Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Camilla: Bewitching Beauty",
            weapon: "Camilla's Axe",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",

                assist: "",
                special: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Camilla: Bewitching Beauty",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[0], 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });
        unit.getOne("Stats").hp = 999;

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = unit.getOne("CombatBuff");

        assert.equal(combatBuff.atk, 4);
        assert.equal(combatBuff.spd, 4);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally]);

        // TEST_GAME_WORLD.debugger.drawMap({
        //     includeUnits: true,
        //     highlightTiles: new Set(Array.from(TEST_GAME_WORLD.getEntities("Side")).map((i) => {
        //         const pos = i.getOne("Position");
        //         return TEST_GAME_WORLD.state.map[pos.y][pos.x];
        //     }))
        // });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuffAfterAllyDeath = unit.getOne("CombatBuff");

        assert.equal(combatBuffAfterAllyDeath.atk, 4);
        assert.equal(combatBuffAfterAllyDeath.spd, 4);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally2]);

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuffAfterOtherAllyDeath = unit.getOne("CombatBuff");

        assert.equal(combatBuffAfterOtherAllyDeath, undefined);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([unit, enemy]);
    });

    it("Candied Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Candied Dagger",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });
        unit.getOne("Stats").hp = 999;

        enemy.addComponent({
            type: "Battling"
        });

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[1], 2);

        enemy.getOne("Stats").hp = 999;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = unit.getOne("CombatBuff");
        assert.equal(combatBuff.spd, 4);

        const damageIncrease = unit.getOne("DamageIncrease");
        const combatStats = getCombatStats(unit);
        const enemyCombatStats = getCombatStats(enemy);
        const damage = unit.getOne("DealDamage");

        assert.equal(damageIncrease.amount, Math.floor(combatStats.spd / 10));
        assert.equal(damage.attacker.damage, (combatStats.atk - enemyCombatStats.def) + Math.floor(combatStats.spd / 10));

        TEST_GAME_WORLD.runSystems("after-combat");

        const enemyDebuff = enemy.getOne("MapDebuff");

        assert.equal(enemyDebuff.def, -7);
        assert.equal(enemyDebuff.res, -7);

        const enemyOtherDebuff = enemyAlly.getOne("MapDebuff");
        assert.equal(enemyOtherDebuff.def, -7);
        assert.equal(enemyOtherDebuff.res, -7);

        killUnits([unit, enemy, enemyAlly]);
    });

    it("Candlelight", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Loving Priestess",
            weapon: "Candlelight",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(enemy.getOne("PreventCounterattack"));

        killUnits([enemy, unit]);
    });

    it("Candlelight+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Loving Priestess",
            weapon: "Candlelight+",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(enemy.getOne("PreventCounterattack"));
        assert(enemyAlly.getOne("PreventCounterattack"));

        killUnits([enemy, enemyAlly, unit]);
    });

    for (let grade of ["", "+"]) {
        it(`Carrot Axe${grade}`, () => {
            const axeUnit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                weapon: `Carrot Axe${grade}`,
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cecilia: Etrurian General",
                weapon: "",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[1], 1);

            axeUnit.getOne("Stats").hp = 1;

            axeUnit.addComponent({
                type: "Battling"
            });

            enemy.addComponent({
                type: "Battling"
            });

            axeUnit.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(axeUnit.getOne("Stats").hp, 5);

            killUnits([axeUnit, enemy]);
        });

        it(`Carrot Lance${grade}`, () => {
            const lanceUnit = TEST_GAME_WORLD.createHero({
                name: "Cordelia: Knight Paragon",
                weapon: `Carrot Lance${grade}`,
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cecilia: Etrurian General",
                weapon: "",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[1], 1);

            lanceUnit.getOne("Stats").hp = 1;

            lanceUnit.addComponent({
                type: "Battling"
            });

            enemy.addComponent({
                type: "Battling"
            });

            lanceUnit.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(lanceUnit.getOne("Stats").hp, 5);

            killUnits([lanceUnit, enemy]);
        });
    }

    it("Cherche's Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Cherche: Wyvern Friend",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            weapon: "Cherche's Axe",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Stats").spd, level40Stats["Cherche: Wyvern Friend"].spd.standard - 5);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            weapon: "",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "",
                B: "",
                C: "",
            },
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
        assert(unit.getOne("BraveWeapon"));
        const turns = generateTurns(unit, enemy, getCombatStats(unit), getCombatStats(enemy));
        assert.equal(turns[0], unit);
        assert.equal(turns[1], unit);
        TEST_GAME_WORLD.runSystems("after-combat");

        unit.removeComponent(unit.getOne("InitiateCombat"));

        enemy.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert(!unit.getOne("BraveWeapon"));
        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([unit, enemy]);
    });

    it("Clarisse's Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);
    });
});