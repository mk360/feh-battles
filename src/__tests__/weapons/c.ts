import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import collectMapMods from "../../systems/collect-map-mods";
import generateTurns from "../../systems/generate-turns";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world"
import killUnits from "../utils/kill-units";
import blankKit from "../utils/blank-kit";

describe("Weapons in C", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });
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
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Camilla: Bewitching Beauty",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: blankKit(),
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
    });

    it("Candied Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Candied Dagger",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: blankKit(),
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
            skills: blankKit(),
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
    });

    it("Candlelight", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Loving Priestess",
            weapon: "Candlelight",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(enemy.getOne("PreventCounterattack"));

    });

    it("Candlelight+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sakura: Loving Priestess",
            weapon: "Candlelight+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "",
            skills: blankKit(),
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

    });

    for (let grade of ["", "+"]) {
        it(`Carrot Axe${grade}`, () => {
            const axeUnit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                weapon: `Carrot Axe${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cecilia: Etrurian General",
                weapon: "",
                skills: blankKit(),
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

        });

        it(`Carrot Lance${grade}`, () => {
            const lanceUnit = TEST_GAME_WORLD.createHero({
                name: "Cordelia: Knight Paragon",
                weapon: `Carrot Lance${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cecilia: Etrurian General",
                weapon: "",
                skills: blankKit(),
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

        });
    }

    it("Cherche's Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Cherche: Wyvern Friend",
            skills: blankKit(),
            weapon: "Cherche's Axe",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Stats").spd, level40Stats["Cherche: Wyvern Friend"].spd.standard - 5);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            weapon: "",
            skills: blankKit(),
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
        const turns = generateTurns(unit, enemy);
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

    });

    it("Clarisse's Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 99;
        unit.getOne("Stats").hp = 99;

        unit.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(enemyAlly.getOne("MapDebuff"));

        const mapMods = collectMapMods(enemyAlly);
        assert.deepEqual(mapMods.debuffs, {
            atk: -5,
            spd: -5,
            def: 0,
            res: 0
        });

    });

    it("Clarisse's Bow+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            weapon: "",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 99;
        unit.getOne("Stats").hp = 99;

        unit.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(enemyAlly.getOne("MapDebuff"));

        const mapMods = collectMapMods(enemyAlly);
        assert.deepEqual(mapMods.debuffs, {
            atk: -5,
            spd: -5,
            def: 0,
            res: 0
        });

    });

    it("Cordelia's Lance", () => {
        const lanceUnit = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Knight Paragon",
            skills: blankKit(),
            weapon: `Cordelia's Lance`,
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(lanceUnit.getOne("Stats").spd, level40Stats["Cordelia: Knight Paragon"].spd.standard - 2);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Abel: The Panther",
            weapon: "",
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
        const turns = generateTurns(lanceUnit, enemy);
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

    });

    it("Corvus Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Henry: Twisted Mind",
            skills: blankKit(),
            weapon: "Corvus Tome",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Clarisse's Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 4);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Eliwood: Knight of Lycia",
            weapon: "",
            skills: blankKit(),
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
        assert.equal(getAttackerAdvantage(unit, enemy), 0.2);
        assert.equal(getAttackerAdvantage(enemy, unit), -0.2);
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(getAttackerAdvantage(unit, enemy2), 0);
        assert.equal(getAttackerAdvantage(enemy2, unit), 0);
    });

    it("Concealed Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Athena: Borderland Sword",
            skills: {
                A: "Heavy Blade 3",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Moonbow",
            },
            weapon: "Concealed Blade",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        unit.getOne("Special").cooldown = 0;

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: blankKit(),
            weapon: "",
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        opponent.addComponent({
            type: "Battling"
        });

        opponent.getOne("Stats").def = unit.getOne("Stats").atk - 9;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const specialTurn = Array.from(unit.getComponents("DealDamage")).find((turn) => turn.attacker.triggerSpecial);
        assert.equal(specialTurn.attacker.damage, 9 + 10 + Math.floor(0.3 * getCombatStats(opponent).def))
        // 9 standard turn
        // 10 bonus from concealed blade
        // the rest is from moonbow

    });

    it("Crimson Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sheena: Princess of Gra",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Crimson Axe",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });

    it("Cupid Arrow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: blankKit(),
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const pos = unit.getOne("Position");

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Knight Paragon",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[0], 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x: pos.x + 1,
            y: pos.y + 2
        }, false);

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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(ally1.getOne("MapBuff"));
        assert(!ally2.getOne("MapBuff"));
        assert.equal(ally1.getOne("MapBuff").def, 2);
        assert.equal(ally1.getOne("MapBuff").res, 2);
    });

    it("Cupid Arrow+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: blankKit(),
            weapon: "Cupid Arrow+",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const pos = unit.getOne("Position");

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Knight Paragon",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[0], 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cordelia: Perfect Bride",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cupid Arrow",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x: pos.x + 1,
            y: pos.y + 2
        }, false);

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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        assert(!ally2.getOne("MapBuff"));
        assert.equal(ally1.getOne("MapBuff").def, 2);
        assert.equal(ally1.getOne("MapBuff").res, 2);
    });

    it("Cursed Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Valter: Dark Moonstone",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cursed Lance",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
        assert.equal(unit.getOne("Stats").spd, level40Stats["Valter: Dark Moonstone"].spd.standard + 2);
        assert.equal(unit.getOne("Stats").spd, level40Stats["Valter: Dark Moonstone"].spd.standard + 2);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Valter: Dark Moonstone",
            skills: blankKit(),
            weapon: "Cursed Lance",
            rarity: 5,
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
        TEST_GAME_WORLD.runSystems("combat");
        const curHP = unit.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(unit.getOne("Stats").hp, curHP - 4);
    });

    it("Cymbeline", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sanaki: Begnion's Apostle",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cymbeline",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Sanaki: Begnion's Apostle",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cymbeline",
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Sanaki: Begnion's Apostle",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            weapon: "Cymbeline",
            rarity: 5,
        }, TEAM_IDS[0], 4);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Valter: Dark Moonstone",
            skills: blankKit(),
            weapon: "Cursed Lance",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling",
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
        const mapBuff = collectMapMods(ally);
        assert.equal(mapBuff.changes.atk, 4);
        assert(!ally2.getOne("MapBuff"));
    });
});