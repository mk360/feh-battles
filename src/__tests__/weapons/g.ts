import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import { applyMapComponent } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import getDistance from "../../systems/get-distance";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("G", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });
    it("Geirskögul", () => {
        const lucina = TEST_GAME_WORLD.createHero({
            name: "Lucina: Brave Princess",
            weapon: "Geirskögul",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const { x, y } = lucina.getOne("Position");

        assert.equal(lucina.getOne("Stats").def, level40Stats["Lucina: Brave Princess"].def.standard + 3);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            weapon: "Forblaze",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 3);


        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x,
            y: y + 1
        }, false);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            weapon: "Armads",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const c1 = ally.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const combatMods = collectCombatMods(ally);
        assert.equal(combatMods.spd, 3);
        assert.equal(combatMods.atk, 3);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        enemy.getOne("Stats").hp = enemy.getOne("Stats").maxHP;
        ally.removeComponent(c1);
        ally2.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        assert(!ally2.getOne("CombatBuff"));
    });

    it("Gladiator's Blade", () => {
        const ogma = TEST_GAME_WORLD.createHero({
            name: "Ogma: Loyal Blade",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
            },
            rarity: 5,
            weapon: "Gladiator's Blade",
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: blankKit(),
            weapon: "Iron Sword",
            rarity: 5
        }, TEAM_IDS[1], 2);

        ogma.addComponent({
            type: "Battling"
        });

        ogma.addComponent({
            type: "InitiateCombat"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns = generateTurns(ogma, opponent);
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(ogma.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns.filter((i) => ogma === i).length * 2 - turns.filter((i) => ogma !== i).length, 0));
    });

    it("Gloom Breath", () => {
        const corrin = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            skills: blankKit(),
            rarity: 5,
            weapon: "Gloom Breath",
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: blankKit(),
            weapon: "Gronnblade+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        const opponentAlly = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: blankKit(),
            weapon: "Gronnblade+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        corrin.addComponent({
            type: "Battling"
        });

        corrin.addComponent({
            type: "InitiateCombat"
        });
        const pos = corrin.getOne("Position");
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, {
            x: pos.x,
            y: pos.y + 2
        }, false);

        TEST_GAME_WORLD.moveUnit(opponentAlly.id, {
            x: opponent.getOne("Position").x + 1,
            y: opponent.getOne("Position").y + 1,
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");
        const mapDebuff = opponent.getOne("MapDebuff");
        assert.equal(mapDebuff.atk, -7);
        assert.equal(mapDebuff.spd, -7);
        opponent.removeComponent(mapDebuff);
        TEST_GAME_WORLD.runSystems("before-combat");
        assert(corrin.getOne("TargetLowestDefense"));
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        assert(opponent.getOne("MapDebuff"));
        assert(opponentAlly.getOne("MapDebuff"));
    });

    for (let grade of ["", "+"]) {
        it(`Green Egg${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                weapon: `Green Egg${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const opponent = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                weapon: `Green Egg${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            unit.addComponent({
                type: "InitiateCombat"
            });

            opponent.addComponent({
                type: "Battling"
            });

            unit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            const hp = unit.getOne("Stats").hp;
            const enemyHP = opponent.getOne("Stats").hp;
            TEST_GAME_WORLD.runSystems("after-combat");
            assert.equal(unit.getOne("Stats").hp, hp + 4);
            assert.equal(enemyHP, enemyHP);
        });
    }

    it("Grimoire", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Nowi: Eternal Witch",
            weapon: `Grimoire`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Soren: Shrewd Strategist",
            weapon: `Green Egg+`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 3);

        const tiles = TEST_GAME_WORLD.getUnitMovement(unit.id);
        const warpTiles = Array.from(tiles.warpTiles);
        const pos = unit.getOne("Position") as null as { x: number; y: number };
        assert(warpTiles.map((i) => {
            return getDistance(pos, i as null as { x: number; y: number });
        }).every(() => 1));
    });

    it("Golden Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Saber: Driven Mercenary",
            weapon: "Golden Dagger",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });

    it("Golden Naginata", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Subaki: Perfect Expert",
            weapon: "Golden Naginata",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Amelia: Rose of the War",
            weapon: "Silver Axe+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);

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
        const combatBuff = collectCombatMods(unit);
        assert.equal(combatBuff.atk, 3);
        assert.equal(combatBuff.spd, 3);
        assert.equal(combatBuff.def, 3);
        assert.equal(combatBuff.res, 3);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Gradivus", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            weapon: "Gradivus",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Klein: Silver Nobleman",
            weapon: "Brave Bow+",
            skills: blankKit(),
            rarity: 5,
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
        assert(unit.getOne("Counterattack"));
        const turns = generateTurns(enemy, unit);
        assert(turns.find((i) => i === unit));
    });

    it("Grado Poleax", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Amelia: Rose of the War",
            weapon: "Grado Poleax",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });

    for (let grade of ["", "+"]) {
        it(`Gravity${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Elise: Budding Flower",
                weapon: `Gravity${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: `Iron Sword`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            unit.addComponent({
                type: "InitiateCombat"
            });

            enemy.addComponent({
                type: "Battling"
            });

            unit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");

            assert(enemy.getOne("GravityComponent"));
        });

        it(`Gronnblade${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                weapon: `Gronnblade${grade}`,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
                rarity: 5
            }, TEAM_IDS[0], 1);

            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown + 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: `Iron Sword`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            applyMapComponent(unit, "MapBuff", {
                atk: 5,
                spd: 5,
                def: 0,
                res: 0
            });

            unit.addComponent({
                type: "InitiateCombat"
            });

            enemy.addComponent({
                type: "Battling"
            });

            unit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            const mapMods = collectCombatMods(unit);
            assert.equal(mapMods.atk, 10);
            TEST_GAME_WORLD.runSystems("after-combat");
        });

        it(`Gronnraven${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                weapon: `Gronnraven${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Saizo: Angry Ninja",
                weapon: "Iron Dagger",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            unit.addComponent({
                type: "InitiateCombat"
            });

            enemy.addComponent({
                type: "Battling"
            });

            unit.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert.equal(getAttackerAdvantage(unit, enemy), 0.2);
            TEST_GAME_WORLD.runSystems("after-combat");
        });

        it(`Gronnwolf${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                weapon: `Gronnwolf${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Ursula: Blue Crow",
                weapon: "Elthunder",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            assert(checkBattleEffectiveness(unit, enemy));
        });
    }

    it("Guardian's Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Hawkeye: Desert Guardian",
            weapon: "Guardian's Axe",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });
});