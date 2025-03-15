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
import collectCombatMods from "../../systems/collect-combat-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";

describe("D", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Dark Breath", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
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
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
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

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
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

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 4);

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

        const mapMods = collectMapMods(enemy2);
        assert.equal(mapMods.debuffs.atk, -5);
        assert.equal(mapMods.debuffs.spd, -5);
        assert(!enemy3.getOne("MapDebuff"));
    });

    it("Dark Breath+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath+",
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
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
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

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
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

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 4);

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

        const mapMods = collectMapMods(enemy2);
        assert.equal(mapMods.debuffs.atk, -5);
        assert.equal(mapMods.debuffs.spd, -5);
        assert(!enemy3.getOne("MapDebuff"));
    });

    it("Dark Excalibur", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sonya: Vengeful Mage",
            weapon: "Dark Excalibur",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Night Sky",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        unit.getOne("Special").cooldown = 0;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Sonya: Vengeful Mage",
            weapon: "Dark Excalibur",
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

        enemy.getOne("Stats").res = unit.getOne("Stats").atk - 10;

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
        const dealtDamage = Array.from(unit.getComponents("DealDamage")).map((i) => i.getObject(false));
        const specialTriggered = dealtDamage.find((i) => i.attacker.triggerSpecial);
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(specialTriggered.attacker.damage, 10 + 10 + 5);
    });

    it("Dancer's Fan", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan",
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

        const ally = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 2);
        ally.getOne("Stats").hp = 1;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(ally.getOne("Stats").hp, 8);

        const mapChanges = collectMapMods(enemy);
        assert.equal(mapChanges.debuffs.def, -5);
        assert.equal(mapChanges.debuffs.res, -5);
    });

    it("Dancer's Fan+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan+",
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

        const ally = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 2);
        ally.getOne("Stats").hp = 1;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(ally.getOne("Stats").hp, 8);

        const mapChanges = collectMapMods(enemy);
        assert.equal(mapChanges.debuffs.def, -7);
        assert.equal(mapChanges.debuffs.res, -7);
    });

    for (let grade of ["", "+"]) {
        it(`Dancer's Ring${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Inigo: Indigo Dancer",
                weapon: `Dancer's Ring${grade}`,
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

            const ally = TEST_GAME_WORLD.createHero({
                name: "Gaius: Candy Stealer",
                weapon: "Dancer's Fan",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[0], 2);
            ally.getOne("Stats").hp = 1;

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
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
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(ally.getOne("Stats").hp, 8);
        });

        it(`Dancer's Score${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Shigure: Dark Sky Singer",
                weapon: `Dancer's Score${grade}`,
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

            const ally = TEST_GAME_WORLD.createHero({
                name: "Gaius: Candy Stealer",
                weapon: "Dancer's Fan",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    special: "",
                    assist: "",
                },
                rarity: 5
            }, TEAM_IDS[0], 2);
            ally.getOne("Stats").hp = 1;

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
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
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(ally.getOne("Stats").hp, 8);
        });
    }

    it("Dark Aura", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Delthea: Free Spirit",
            weapon: "Dark Aura",
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

        const swordAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 2);

        const tomeAlly = TEST_GAME_WORLD.createHero({
            name: "Delthea: Free Spirit",
            weapon: "Dark Aura",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 3);

        const pos = unit.getOne("Position");
        TEST_GAME_WORLD.moveUnit(tomeAlly.id, {
            x: pos.x,
            y: pos.y + 1
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        assert(!tomeAlly.getOne("MapBuff"));
        const mapMods = collectMapMods(swordAlly);
        assert.equal(mapMods.buffs.atk, 6);
    });

    it("Dark Royal Spear", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Dark Royal Spear",
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
            name: "Berkut: Prideful Prince",
            weapon: "Dark Royal Spear",
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

        unit.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;
        enemy.getOne("Stats").maxHP = 999;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const unitMods = collectCombatMods(unit);
        assert.equal(unitMods.atk, 5);
        assert.equal(unitMods.def, 5);
        assert.equal(unitMods.res, 5);

        const enemyMods = collectCombatMods(unit);
        assert.equal(enemyMods.atk, 5);
        assert.equal(enemyMods.def, 5);
        assert.equal(enemyMods.res, 5);

        TEST_GAME_WORLD.runSystems("after-combat");

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const enemyModsAgain = collectCombatMods(enemy);
        assert.equal(enemyModsAgain.atk, 5);
        assert.equal(enemyModsAgain.def, 5);
        assert.equal(enemyModsAgain.res, 5);

        const unitModsAgain = collectCombatMods(unit);
        assert.equal(unitModsAgain.atk, 0);
        assert.equal(unitModsAgain.def, 0);
        assert.equal(unitModsAgain.res, 0);
    });

    it("Dauntless Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Nephenee: Fierce Halberdier",
            weapon: "Dauntless Lance",
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
            name: "Hector: General of Ostia",
            weapon: "Armads",
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

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Daybreak Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "Daybreak Lance",
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

    it("Deathly Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Jaffar: Angel of Death",
            weapon: "Deathly Dagger",
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
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
        enemy.getOne("Stats").hp = 8;
        TEST_GAME_WORLD.runSystems("after-combat");
        const mapMods = collectMapMods(enemy);

        assert.equal(enemy.getOne("Stats").hp, 1);
        assert.equal(mapMods.debuffs.def, -7);
        assert.equal(mapMods.debuffs.res, -7);
    });
});