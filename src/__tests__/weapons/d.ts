import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import { applyMapComponent } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAffinity from "../../systems/get-affinity";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("Weapons in D", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Dark Breath", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
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
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: blankKit(),
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
                ...blankKit(),
                special: "Night Sky",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        unit.getOne("Special").cooldown = 0;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Sonya: Vengeful Mage",
            weapon: "Dark Excalibur",
            skills: blankKit(),
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
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);
        ally.getOne("Stats").hp = 1;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Gaius: Candy Stealer",
            weapon: "Dancer's Fan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);
        ally.getOne("Stats").hp = 1;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const ally = TEST_GAME_WORLD.createHero({
                name: "Gaius: Candy Stealer",
                weapon: "Dancer's Fan",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 2);
            ally.getOne("Stats").hp = 1;

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
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
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(ally.getOne("Stats").hp, 8);
        });

        it(`Dancer's Score${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Shigure: Dark Sky Singer",
                weapon: `Dancer's Score${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const ally = TEST_GAME_WORLD.createHero({
                name: "Gaius: Candy Stealer",
                weapon: "Dancer's Fan",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 2);
            ally.getOne("Stats").hp = 1;

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Arden: Strong and Tough",
                weapon: "Iron Sword",
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
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");

            assert.equal(ally.getOne("Stats").hp, 8);
        });
    }

    it("Dark Aura", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Delthea: Free Spirit",
            weapon: "Dark Aura",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const swordAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);

        const tomeAlly = TEST_GAME_WORLD.createHero({
            name: "Delthea: Free Spirit",
            weapon: "Dark Aura",
            skills: blankKit(),
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
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Dark Royal Spear",
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
            skills: blankKit(),
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
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            weapon: "Iron Sword",
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
        enemy.getOne("Stats").hp = 8;
        TEST_GAME_WORLD.runSystems("after-combat");
        const mapMods = collectMapMods(enemy);

        assert.equal(enemy.getOne("Stats").hp, 1);
        assert.equal(mapMods.debuffs.def, -7);
        assert.equal(mapMods.debuffs.res, -7);
    });

    for (let grade of ["", "+"]) {
        it(`Deft Harpoon${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Robin: Seaside Tactician",
                weapon: `Deft Harpoon${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Robin: Seaside Tactician",
                weapon: `Deft Harpoon${grade}`,
                skills: blankKit(),
                rarity: 5
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
            enemy.getOne("Stats").hp = enemy.getOne("Stats").maxHP - 1;
            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            const combatBuff = collectCombatMods(unit);
            assert.equal(combatBuff.atk, 2);
            assert.equal(combatBuff.spd, 2);
            assert.equal(combatBuff.def, 2);
            assert.equal(combatBuff.res, 2);
            assert(!enemy.getOne("CombatBuff"));
            unit.getOne("Stats").hp = unit.getOne("Stats").maxHP;
            const curHP = unit.getOne("Stats").hp;
            TEST_GAME_WORLD.runSystems("after-combat");
            assert.equal(unit.getOne("Stats").hp, curHP - 2);
        });
    }

    it("Devil Axe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Barst: The Hatchet",
            weapon: "Devil Axe",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        unit.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });
        const enemy = TEST_GAME_WORLD.createHero({
            name: "Barst: The Hatchet",
            weapon: "Devil Axe",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "PreventCounterattack"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const combatBuff = collectCombatMods(unit);
        assert.equal(combatBuff.atk, 4);
        assert.equal(combatBuff.spd, 4);
        assert.equal(combatBuff.def, 4);
        assert.equal(combatBuff.res, 4);
        const curHP = unit.getOne("Stats").hp;
        const enemyHP = enemy.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(unit.getOne("Stats").hp, curHP - 4);
        assert.equal(enemy.getOne("Stats").hp, enemyHP);
    });

    it("Dignified Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Virion: Elite Archer",
            weapon: "Dignified Bow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const markableEnemy = TEST_GAME_WORLD.createHero({
            name: "Virion: Elite Archer",
            weapon: "Silver Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        markableEnemy.getOne("Stats").hp = markableEnemy.getOne("Stats").hp - 1;
        const referencePosition = markableEnemy.getOne("Position").getObject(false);

        const adjacentEnemy = TEST_GAME_WORLD.createHero({
            name: "Virion: Elite Archer",
            weapon: "Silver Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.moveUnit(adjacentEnemy.id, {
            x: referencePosition.x,
            y: referencePosition.y - 1
        }, false);

        const nonAdjacentEnemy = TEST_GAME_WORLD.createHero({
            name: "Virion: Elite Archer",
            weapon: "Silver Bow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 3);

        TEST_GAME_WORLD.moveUnit(nonAdjacentEnemy.id, {
            x: referencePosition.x - 2,
            y: referencePosition.y - 1
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        assert(adjacentEnemy.getOne("PanicComponent"));
        assert(markableEnemy.getOne("PanicComponent"));
        assert(!nonAdjacentEnemy.getOne("PanicComponent"));
    });

    it("Dire Thunder", () => {
        const reinhardt1 = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            skills: blankKit(),
            weapon: "Dire Thunder",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(reinhardt1.getOne("Stats").spd, level40Stats["Reinhardt: Thunder's Fist"].spd.standard - 5);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            weapon: "Dire Thunder",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;

        reinhardt1.addComponent({
            type: "InitiateCombat"
        });

        reinhardt1.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert(reinhardt1.getOne("BraveWeapon"));
        assert(!enemy.getOne("BraveWeapon"));
        const turns = generateTurns(reinhardt1, enemy);
        assert.equal(turns[0], reinhardt1);
        assert.equal(turns[1], reinhardt1);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Divine Naga", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Divine Naga",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const dragon = TEST_GAME_WORLD.createHero({
            name: "Tiki: Naga's Voice",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);
        unit.addComponent({
            type: "Battling",
        });
        unit.addComponent({
            type: "InitiateCombat"
        });
        dragon.addComponent({
            type: "Battling"
        });
        applyMapComponent(dragon, "MapBuff", {
            atk: 6
        }, unit);

        assert(checkBattleEffectiveness(unit, dragon));
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const combatMods = collectCombatMods(dragon);
        assert.equal(combatMods.atk, -6);
    });

    it("Divine Tyrfing", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sigurd: Holy Knight",
            weapon: "Divine Tyrfing",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const mage = TEST_GAME_WORLD.createHero({
            name: "Arvis: Emperor of Flame",
            weapon: "Valflame",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.getOne("Stats").res = mage.getOne("Stats").atk - 10;

        mage.addComponent({
            type: "InitiateCombat",
        });

        mage.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = mage.getOne("DealDamage");
        assert.equal(dealDamage.attacker.damage, 5);
    });

    it("Draconic Poleaxe", () => {
        const green = TEST_GAME_WORLD.createHero({
            name: "Titania: Mighty Mercenary",
            weapon: "Draconic Poleaxe",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const blue = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            weapon: "Sealife Tome",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const red = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        green.addComponent({
            type: "Battling"
        });

        blue.addComponent({
            type: "InitiateCombat"
        });
        blue.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        assert.equal(getAffinity(green, blue), 0.2);
        assert.equal(getAffinity(green, red), -0.2);
    });

    it("Durandal", () => {
        const attacker = TEST_GAME_WORLD.createHero({
            name: "Eliwood: Knight of Lycia",
            weapon: "Durandal",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const defender = TEST_GAME_WORLD.createHero({
            name: "Eliwood: Knight of Lycia",
            weapon: "Durandal",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        attacker.addComponent({
            type: "Battling"
        });

        attacker.addComponent({
            type: "InitiateCombat"
        });

        defender.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        const buffs = collectCombatMods(attacker);
        assert(!defender.getOne("CombatBuff"));
        assert.equal(buffs.atk, 4);
    });
});