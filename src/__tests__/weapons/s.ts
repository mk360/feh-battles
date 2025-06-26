import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAffinity from "../../systems/get-affinity";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("S", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Saizo's Star", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            rarity: 5,
            weapon: "Saizo's Star",
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Celica: Caring Princess",
            rarity: 5,
            weapon: "Ragnarok",
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Celica: Caring Princess",
            rarity: 5,
            weapon: "Ragnarok",
            skills: blankKit(),
        }, TEAM_IDS[1], 2);

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
        assert(enemy.getOne("MapDebuff"));
        const { debuffs } = collectMapMods(enemyAlly);
        assert.equal(debuffs.atk, -6);
        assert.equal(debuffs.spd, -6);
        assert.equal(debuffs.def, -6);
        assert.equal(debuffs.res, -6);
    });

    it("Sapphire Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "Sapphire Lance",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getAffinity(unit, enemy), 0.2);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Sapphire Lance+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "Sapphire Lance+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getAffinity(unit, enemy), 0.2);
    });

    it("Scarlet Sword", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Navarre: Scarlet Sword",
            weapon: "Scarlet Sword",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[0], 1);
        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
    });

    it("Sealife Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Novice Vacationer",
            weapon: "Sealife Tome",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);
        const ally = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 2);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);
        ally.addComponent({
            type: "InitiateCombat"
        });
        enemy.addComponent({
            type: "Battling"
        });
        ally.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const combatMods = collectCombatMods(ally);
        assert.equal(combatMods.atk, 1);
        assert.equal(combatMods.spd, 1);
    });

    it("Sealife Tome+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Novice Vacationer",
            weapon: "Sealife Tome+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);
        const ally = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 2);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);
        ally.addComponent({
            type: "InitiateCombat"
        });
        enemy.addComponent({
            type: "Battling"
        });
        ally.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        const combatMods = collectCombatMods(ally);
        assert.equal(combatMods.atk, 1);
        assert.equal(combatMods.spd, 1);
    });

    it("Seashell", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Frederick: Horizon Watcher",
            weapon: "Seashell",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
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
        const combatBuffs = collectCombatMods(unit);
        assert.equal(combatBuffs.atk, 2);
        assert.equal(combatBuffs.spd, 2);
        assert.equal(combatBuffs.def, 2);
        assert.equal(combatBuffs.res, 2);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(unit.getOne("Stats").hp, unit.getOne("Stats").maxHP - 2);
        const { debuffs } = collectMapMods(enemy);
        assert.equal(debuffs.def, -5);
        assert.equal(debuffs.res, -5);
    });

    it("Seashell+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Frederick: Horizon Watcher",
            weapon: "Seashell+",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            rarity: 5,
            skills: blankKit(),
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
        const combatBuffs = collectCombatMods(unit);
        assert.equal(combatBuffs.atk, 2);
        assert.equal(combatBuffs.spd, 2);
        assert.equal(combatBuffs.def, 2);
        assert.equal(combatBuffs.res, 2);
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(unit.getOne("Stats").hp, unit.getOne("Stats").maxHP - 2);
        const { debuffs } = collectMapMods(enemy);
        assert.equal(debuffs.def, -7);
        assert.equal(debuffs.res, -7);
    });

    it("Selena's Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Selena: Cutting Wit",
            rarity: 5,
            skills: blankKit(),
            weapon: "Selena's Blade"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            rarity: 5,
            skills: blankKit(),
            weapon: "Silver Sword+"
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
        const combatBuff = collectCombatMods(unit);
        assert.equal(combatBuff.atk, 3);
        assert.equal(combatBuff.spd, 3);
        assert.equal(combatBuff.def, 3);
        assert.equal(combatBuff.res, 3);
        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Setsuna's Yumi", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Setsuna: Absent Archer",
            weapon: "Setsuna's Yumi",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            weapon: "Forblaze",
            rarity: 5,
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            weapon: "Armads",
            rarity: 5,
            skills: blankKit(),
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
        const combatMods = collectCombatMods(unit);
        assert.equal(combatMods.atk, 4);
        assert.equal(combatMods.def, 4);
        assert.equal(combatMods.res, 4);
        assert.equal(combatMods.spd, 4);
        TEST_GAME_WORLD.runSystems("after-combat");

        enemy.removeComponent(enemy.getOne("Battling"));
        enemy2.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        assert(!unit.getOne("CombatBuff"));
    });

    it("Shanna's Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Shanna: Sprightly Flier",
            weapon: "Shanna's Lance",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[0], 1);
        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
    });

    it("Siegfried", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Xander: Paragon Knight",
            skills: blankKit(),
            rarity: 5,
            weapon: "Siegfried"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            skills: blankKit(),
            rarity: 5,
            weapon: "Silver Dagger+"
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

    it("Sieglinde", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Eirika: Restoration Lady",
            skills: blankKit(),
            rarity: 5,
            weapon: "Sieglinde"
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Eirika: Restoration Lady",
            skills: blankKit(),
            rarity: 5,
            weapon: ""
        }, TEAM_IDS[0], 2);

        TEST_GAME_WORLD.runSystems("every-turn");
        const atkBuff = ally.getOne("MapBuff");
        assert(atkBuff);
        assert.equal(atkBuff.atk, 4);
    });

    it("Siegmund", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Ephraim: Restoration Lord",
            skills: blankKit(),
            rarity: 5,
            weapon: "Siegmund"
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Ephraim: Restoration Lord",
            skills: blankKit(),
            rarity: 5,
            weapon: ""
        }, TEAM_IDS[0], 2);

        TEST_GAME_WORLD.runSystems("every-turn");
        const atkBuff = ally.getOne("MapBuff");
        assert(atkBuff);
        assert.equal(atkBuff.atk, 3);
    });

    it("Silverbrand", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Seth: Silver Knight",
            weapon: "Silverbrand",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getAffinity(unit, enemy), -0.2);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    for (let rank of ["", "+"]) {
        it(`Slaying Axe${rank}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                weapon: `Slaying Axe${rank}`,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
        });

        it(`Slaying Bow${rank}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Klein: Silver Nobleman",
                weapon: `Slaying Bow${rank}`,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
        });

        it(`Slaying Edge${rank}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Lon'qu: Solitary Blade",
                weapon: `Slaying Edge${rank}`,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
        });

        it(`Slaying Lance${rank}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Lukas: Sharp Soldier",
                weapon: `Slaying Lance${rank}`,
                skills: {
                    ...blankKit(),
                    special: "Aether"
                },
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
        });
    }

    it("Slow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Elise: Budding Flower",
            weapon: "Slow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
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
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const debuff = enemy.getOne("MapDebuff");

        assert.equal(debuff.spd, -6);
    });

    it("Slow+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Elise: Budding Flower",
            weapon: "Slow+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        const debuff = enemy.getOne("MapDebuff");
        const otherDebuff = enemyAlly.getOne("MapDebuff");

        assert.equal(debuff.spd, -7);
        assert.equal(otherDebuff.spd, -7);
    });

    it("Smoke Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            weapon: "Smoke Dagger",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        const debuff = enemy.getOne("MapDebuff");
        const otherDebuff = enemyAlly.getOne("MapDebuff");

        assert(!debuff);
        assert.equal(otherDebuff.def, -4);
        assert.equal(otherDebuff.res, -4);
    });

    it("Smoke Dagger+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            weapon: "Smoke Dagger+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        const debuff = enemy.getOne("MapDebuff");
        const otherDebuff = enemyAlly.getOne("MapDebuff");

        assert(!debuff);
        assert.equal(otherDebuff.def, -6);
        assert.equal(otherDebuff.res, -6);
    });

    it("Sniper's Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Sniper's Bow",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        const { hp } = enemy.getOne("Stats");
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(enemy.getOne("Stats").hp, Math.max(hp - 7, 1));
        assert.equal(enemyAlly.getOne("Stats").hp, enemyAlly.getOne("Stats").maxHP - 7);
        const debuff = enemy.getOne("MapDebuff");
        const otherDebuff = enemyAlly.getOne("MapDebuff");

        assert.equal(debuff.atk, -7);
        assert.equal(debuff.spd, -7);

        assert.equal(otherDebuff.atk, -7);
        assert.equal(otherDebuff.spd, -7);
    });

    it("Solitary Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lon'qu: Solitary Blade",
            weapon: "Solitary Blade",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS[unit.getOne("Special").name].cooldown - 1);
    });

    it("Spectral Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Henry: Happy Vampire",
            weapon: "Spectral Tome",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        assert(enemyAlly.tags.has("Panic"));
    });

    it("Spectral Tome+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Henry: Happy Vampire",
            weapon: "Spectral Tome+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        assert(enemyAlly.tags.has("Panic"));
    });

    it("Springtime Staff", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Genny: Endearing Ally",
            weapon: "Springtime Staff",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
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
        assert(enemyAlly.tags.has("Gravity"));
        assert.equal(unit.getOne("Stats").atk, level40Stats["Genny: Endearing Ally"].atk.standard + 14 + 3);
        assert(enemy.tags.has("Gravity"));
    });

    it("Spy's Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Matthew: Faithful Spy",
            weapon: "Spy's Dagger",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);

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
        const debuff = enemy.getOne("MapDebuff");
        const allyDebuff = enemyAlly.getOne("MapDebuff");
        const buff = unit.getOne("MapBuff");
        const allyBuff = ally.getOne("MapBuff");

        assert.equal(debuff.def, -6);
        assert.equal(debuff.res, -6);
        assert.equal(allyDebuff.def, -6);
        assert.equal(allyDebuff.res, -6);

        assert.equal(buff.def, 6);
        assert.equal(buff.res, 6);
        assert.equal(allyBuff.def, 6);
        assert.equal(allyBuff.res, 6);
    });

    it("Sol Katti", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lyn: Lady of the Plains",
            weapon: "Sol Katti",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        unit.getOne("Stats").hp = Math.floor(unit.getOne("Stats").hp / 2) - 1

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lukas: Sharp Soldier",
            weapon: "",
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

        const turns = generateTurns(unit, enemy);
        assert.equal(turns[0], unit);
        assert.equal(turns[1], unit);
        assert.equal(turns[2], enemy);
    });
});