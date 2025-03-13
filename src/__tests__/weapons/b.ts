import assert from "assert";
import { describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import { applyMapComponent } from "../../systems/apply-map-effect";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import getMapStats from "../../systems/get-map-stats";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";
import level40Stats from "../constants/lv40_stats.json";
import WEAPONS from "../../data/weapons";

describe("B", () => {
    it("Basilikos", () => {
        const raymond = TEST_GAME_WORLD.createHero({
            name: "Raven: Peerless Fighter",
            weapon: "Basilikos",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "Aether",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(raymond.getOne("Special").maxCooldown, SPECIALS[raymond.getOne("Special").name].cooldown - 1);

        killUnits([raymond]);
    });

    it("Berkut's Lance && Berkut's Lance+", () => {
        const berkut1 = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Berkut's Lance",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const berkut2 = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Berkut's Lance",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 1);

        const init = berkut1.addComponent({
            type: "InitiateCombat",
        });
        berkut1.addComponent({
            type: "Battling",
        });
        berkut2.addComponent({
            type: "Battling"
        })

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getCombatStats(berkut2).res, getMapStats(berkut2).res + 4);
        berkut1.removeComponent(init);
        berkut2.addComponent({
            type: "InitiateCombat"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getCombatStats(berkut1).res, getMapStats(berkut1).res + 4);
        TEST_GAME_WORLD.runSystems("after-combat");
        killUnits([berkut1, berkut2]);
    });

    it("Beruka's Axe", () => {
        const beruka = TEST_GAME_WORLD.createHero({
            name: "Beruka: Quiet Assassin",
            weapon: "Beruka's Axe",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "Aether",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(beruka.getOne("Special").maxCooldown, SPECIALS[beruka.getOne("Special").name].cooldown - 1);

        killUnits([beruka]);
    });

    it("Blazing Durandal", () => {
        const roy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5,
            weapon: "Blazing Durandal"
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Iron Sword",
            rarity: 5
        }, TEAM_IDS[1], 2);

        roy.addComponent({
            type: "Battling"
        });

        roy.addComponent({
            type: "InitiateCombat"
        });

        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns = generateTurns(roy, opponent, getCombatStats(roy), getCombatStats(opponent));
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(roy.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns.filter((i) => roy === i).length * 2 - turns.filter((i) => roy !== i).length, 0));

        killUnits([roy]);

        // don't stack with Heavy Blade
        const roy2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "Heavy Blade 3",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5,
            weapon: "Blazing Durandal"
        }, TEAM_IDS[0], 1);

        roy2.addComponent({
            type: "Battling"
        });

        roy2.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns2 = generateTurns(roy2, opponent, getCombatStats(roy2), getCombatStats(opponent));
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(roy2.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns2.filter((i) => roy2 === i).length * 2 - turns2.filter((i) => roy2 !== i).length, 0));

        killUnits([roy2, opponent]);
    });

    it("Blárblade & Blárblade+", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárblade",
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(robin.getOne("Special").maxCooldown, SPECIALS[robin.getOne("Special").name].cooldown + 1);

        applyMapComponent(robin, "MapBuff", {
            atk: 6,
            def: 7,
            res: 3,
            spd: 2
        });

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Iron Sword",
            rarity: 5
        }, TEAM_IDS[1], 2);

        opponent.addComponent({
            type: "Battling"
        });

        robin.addComponent({
            type: "Battling"
        });

        opponent.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { atk } = combatBuff;

        assert.equal(atk, 6 + 7 + 3 + 2);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([robin]);

        const robin2 = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárblade+",
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(robin2.getOne("Special").maxCooldown, SPECIALS[robin2.getOne("Special").name].cooldown + 1);

        applyMapComponent(robin2, "MapBuff", {
            atk: 5,
            def: 5,
            res: 0,
            spd: 0
        });

        robin2.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin2.getOne("CombatBuff");
        const { atk: otherAtk } = combatBuff2;

        assert.equal(otherAtk, 10);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([robin2, opponent]);
    });

    it("Blárowl", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárowl",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Urvan",
            rarity: 5
        }, TEAM_IDS[0], 2);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Rexcalibur+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { type, ...stats } = combatBuff.getObject(false);

        assert.deepEqual(stats, {
            atk: 2,
            spd: 2,
            def: 2,
            res: 2
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "",
            rarity: 5,
        }, TEAM_IDS[0], 3);
        ally2.getOne("Position").x = robin.getOne("Position").x;
        ally2.getOne("Position").y = robin.getOne("Position").y + 1;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin.getOne("CombatBuff");
        const { type: type2, ...stats2 } = combatBuff2.getObject(false);

        assert.deepEqual(stats2, {
            atk: 4,
            spd: 4,
            def: 4,
            res: 4
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally1, ally2, robin, opponent]);
    });

    it("Blárowl+", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárowl+",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Urvan",
            rarity: 5
        }, TEAM_IDS[0], 2);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Rexcalibur+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { type, ...stats } = combatBuff.getObject(false);

        assert.deepEqual(stats, {
            atk: 2,
            spd: 2,
            def: 2,
            res: 2
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "",
            rarity: 5,
        }, TEAM_IDS[0], 4);
        ally2.getOne("Position").x = robin.getOne("Position").x;
        ally2.getOne("Position").y = robin.getOne("Position").y + 1;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin.getOne("CombatBuff");
        const { type: type2, ...stats2 } = combatBuff2.getObject(false);

        assert.deepEqual(stats2, {
            atk: 4,
            spd: 4,
            def: 4,
            res: 4
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally1, ally2, robin, opponent]);
    });

    it("Blárraven", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárraven",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Silver Bow+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        const cmp = opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(robin.getOne("GuaranteedAdvantage"));
        assert.equal(getAttackerAdvantage(robin, opponent), 0.2);

        TEST_GAME_WORLD.runSystems("after-combat");
        opponent.removeComponent(cmp);
        const otherColor = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        otherColor.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(!robin.getOne("GuaranteedAdvantage"));
        assert.equal(getAttackerAdvantage(robin, opponent), 0);

        killUnits([robin, opponent, otherColor]);
    });

    it("Blárraven+", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárraven+",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Silver Bow+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        const cmp = opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(robin.getOne("GuaranteedAdvantage"));
        assert.equal(getAttackerAdvantage(robin, opponent), 0.2);

        TEST_GAME_WORLD.runSystems("after-combat");
        opponent.removeComponent(cmp);
        const otherColor = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        otherColor.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(!robin.getOne("GuaranteedAdvantage"));
        assert.equal(getAttackerAdvantage(robin, opponent), 0);

        killUnits([robin, opponent, otherColor]);
    });

    it("Blárwolf", () => {
        const mae = TEST_GAME_WORLD.createHero({
            name: "Mae: Bundle of Energy",
            rarity: 5,
            weapon: "Blárwolf",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[0], 1);

        const cain = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            rarity: 5,
            weapon: "Brave Sword+",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(mae, cain));

        const anna = TEST_GAME_WORLD.createHero({
            name: "Anna: Commander",
            rarity: 5,
            weapon: "Brave Axe+",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[1], 4);

        assert(!checkBattleEffectiveness(mae, anna));

        killUnits([mae, anna, cain]);
    });

    it("Blárwolf+", () => {
        const mae = TEST_GAME_WORLD.createHero({
            name: "Mae: Bundle of Energy",
            rarity: 5,
            weapon: "Blárwolf+",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[0], 1);

        const cain = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            rarity: 5,
            weapon: "Brave Sword+",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(mae, cain));

        const anna = TEST_GAME_WORLD.createHero({
            name: "Anna: Commander",
            rarity: 5,
            weapon: "Brave Axe+",
            skills: {
                S: "",
                special: "",
                A: "",
                assist: "",
                B: "",
                C: "",
            },
        }, TEAM_IDS[1], 4);

        assert(!checkBattleEffectiveness(mae, anna));

        killUnits([anna, cain, mae]);
    });

    it("Blue Egg", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Shigure: Dark Sky Singer",
            weapon: "Blue Egg",
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

        unit.getOne("Stats").hp = 10;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
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

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(unit.getOne("Stats").hp, 14);

        killUnits([unit, enemy]);
    });

    it("Blue Egg+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Shigure: Dark Sky Singer",
            weapon: "Blue Egg+",
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

        unit.getOne("Stats").hp = 10;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
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

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(unit.getOne("Stats").hp, 14);

        killUnits([unit, enemy]);
    });

    it("Book of Orchids", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Mae: Bundle of Energy",
            weapon: "Book of Orchids",
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
            name: "Arden: Strong and Tough",
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

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const buffs = unit.getOne("CombatBuff");
        assert.equal(buffs.atk, 6);
        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([unit, enemy]);
    });

    it("Bow of Beauty", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Leon: True of Heart",
            weapon: "Bow of Beauty",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
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

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);

        killUnits([unit, enemy]);
    });

    for (let rank of ["", "+"]) {
        it(`Brave Lance${rank}`, () => {
            const lanceUnit = TEST_GAME_WORLD.createHero({
                name: "Abel: The Panther",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `Brave Lance${rank}`,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(lanceUnit.getOne("Stats").atk, level40Stats["Abel: The Panther"].atk.standard + WEAPONS[`Brave Lance${rank}`].might);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Abel: The Panther",
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

            lanceUnit.addComponent({
                type: "InitiateCombat"
            });

            lanceUnit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(lanceUnit.getOne("BraveWeapon"));
            const turns = generateTurns(lanceUnit, enemy, getCombatStats(lanceUnit), getCombatStats(enemy));
            assert.equal(turns[0], lanceUnit);
            assert.equal(turns[1], lanceUnit);
            TEST_GAME_WORLD.runSystems("after-combat");

            lanceUnit.removeComponent(lanceUnit.getOne("InitiateCombat"));

            enemy.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(!lanceUnit.getOne("BraveWeapon"));
            TEST_GAME_WORLD.runSystems("after-combat");

            killUnits([lanceUnit, enemy]);
        });

        it(`Brave Sword${rank}`, () => {
            const swordUnit = TEST_GAME_WORLD.createHero({
                name: "Cain: The Bull",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `Brave Sword${rank}`,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(swordUnit.getOne("Stats").atk, level40Stats["Cain: The Bull"].atk.standard + WEAPONS[`Brave Sword${rank}`].might);

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

            swordUnit.addComponent({
                type: "InitiateCombat"
            });

            swordUnit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(swordUnit.getOne("BraveWeapon"));
            const turns = generateTurns(swordUnit, enemy, getCombatStats(swordUnit), getCombatStats(enemy));
            assert.equal(turns[0], swordUnit);
            assert.equal(turns[1], swordUnit);
            TEST_GAME_WORLD.runSystems("after-combat");

            swordUnit.removeComponent(swordUnit.getOne("InitiateCombat"));

            enemy.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(!swordUnit.getOne("BraveWeapon"));
            TEST_GAME_WORLD.runSystems("after-combat");

            killUnits([swordUnit, enemy]);
        });

        it(`Brave Axe${rank}`, () => {
            const axeUnit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `Brave Axe${rank}`,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(axeUnit.getOne("Stats").atk, level40Stats["Ike: Brave Mercenary"].atk.standard + WEAPONS[`Brave Axe${rank}`].might);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
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

            axeUnit.addComponent({
                type: "InitiateCombat"
            });

            axeUnit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(axeUnit.getOne("BraveWeapon"));
            const turns = generateTurns(axeUnit, enemy, getCombatStats(axeUnit), getCombatStats(enemy));
            assert.equal(turns[0], axeUnit);
            assert.equal(turns[1], axeUnit);
            TEST_GAME_WORLD.runSystems("after-combat");

            axeUnit.removeComponent(axeUnit.getOne("InitiateCombat"));

            enemy.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(!axeUnit.getOne("BraveWeapon"));
            TEST_GAME_WORLD.runSystems("after-combat");

            killUnits([axeUnit, enemy]);
        });

        it(`Brave Bow${rank}`, () => {
            const bowUnit = TEST_GAME_WORLD.createHero({
                name: "Klein: Silver Nobleman",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `Brave Bow${rank}`,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(bowUnit.getOne("Stats").atk, level40Stats["Klein: Silver Nobleman"].atk.standard + WEAPONS[`Brave Bow${rank}`].might);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Klein: Silver Nobleman",
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

            bowUnit.addComponent({
                type: "InitiateCombat"
            });

            bowUnit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(bowUnit.getOne("BraveWeapon"));
            const turns = generateTurns(bowUnit, enemy, getCombatStats(bowUnit), getCombatStats(enemy));
            assert.equal(turns[0], bowUnit);
            assert.equal(turns[1], bowUnit);
            TEST_GAME_WORLD.runSystems("after-combat");

            bowUnit.removeComponent(bowUnit.getOne("InitiateCombat"));

            enemy.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert(!bowUnit.getOne("BraveWeapon"));
            TEST_GAME_WORLD.runSystems("after-combat");

            killUnits([bowUnit, enemy]);
        });
    }
});