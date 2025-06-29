import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import WEAPONS from "../../data/weapons";
import { applyMapComponent } from "../../systems/apply-map-effect";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAffinity from "../../systems/get-affinity";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("Weapons in R", () => {
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

        it(`Rauðrwolf${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Raigh: Dark Child",
                weapon: `Rauðrwolf${grade}`,
                rarity: 5,
                skills: blankKit(),
            }, TEAM_IDS[0], 1);
            const enemy = TEST_GAME_WORLD.createHero({
                name: "Reinhardt: Thunder's Fist",
                skills: blankKit(),
                weapon: "Dire Thunder",
                rarity: 5,
            }, TEAM_IDS[1], 1);
            assert(checkBattleEffectiveness(unit, enemy));
        });
    }

    it("Rebecca's Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Rebecca: Wildflower",
            weapon: "Rebecca's Bow",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown - 1);
    });

    it("Reese's Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Katarina: Wayward One",
            weapon: "Reese's Tome",
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

    it("Regal Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lloyd: White Wolf",
            weapon: "Regal Blade",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Lloyd: White Wolf",
            weapon: "Regal Blade",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").hp--;

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
        assert(!unit.getOne("CombatBuff"));
        const buffs = collectCombatMods(enemy);
        assert.equal(buffs.atk, 2);
        assert.equal(buffs.spd, 2);
    });

    it("Renowned Bow", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gordin: Altean Archer",
            skills: blankKit(),
            weapon: "Renowned Bow",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Stats").spd, level40Stats["Gordin: Altean Archer"].spd.standard - 5);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Gordin: Altean Archer",
            weapon: "Renowned Bow",
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
        assert(!enemy.getOne("BraveWeapon"));
        const turns = generateTurns(unit, enemy);
        assert.equal(turns[0], unit);
        assert.equal(turns[1], unit);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Resolute Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Mia: Lady of Blades",
            skills: {
                ...blankKit(),
                special: "Moonbow"
            },
            weapon: "Resolute Blade",
            rarity: 5,
        }, TEAM_IDS[0], 1);
        unit.getOne("Special").cooldown = 0;

        assert.equal(unit.getOne("Stats").atk, WEAPONS["Resolute Blade"].might + level40Stats["Mia: Lady of Blades"].atk.standard + 3);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Mia: Lady of Blades",
            skills: blankKit(),
            weapon: "Resolute Blade",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").def = 99;

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
        const dealDamage = unit.getOne("DealDamage");
        const enemyStats = getCombatStats(enemy);
        assert.equal(dealDamage.attacker.damage, 0 + Math.floor(enemyStats.def * 0.3) + 10);
    });

    it("Rhomphaia", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clair: Highborn Flier",
            skills: blankKit(),
            weapon: "Rhomphaia",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            skills: blankKit(),
            weapon: "Dire Thunder",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: blankKit(),
            weapon: "Brave Sword+",
            rarity: 5,
        }, TEAM_IDS[1], 2);

        assert(checkBattleEffectiveness(unit, enemy));
        assert(checkBattleEffectiveness(unit, enemy2));
    });

    it("Ridersbane", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clair: Highborn Flier",
            skills: blankKit(),
            weapon: "Ridersbane",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            skills: blankKit(),
            weapon: "Dire Thunder",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Ridersbane+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clair: Highborn Flier",
            skills: blankKit(),
            weapon: "Ridersbane+",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            skills: blankKit(),
            weapon: "Dire Thunder",
            rarity: 5,
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Rogue Dagger", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Matthew: Faithful Spy",
            rarity: 5,
            weapon: "Rogue Dagger",
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        unit.addComponent({
            type: "PreventCounterattack"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });
        unit.addComponent({
            type: "Battling"
        });

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Matthew: Faithful Spy",
            rarity: 5,
            weapon: "Rogue Dagger",
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const { buffs } = collectMapMods(unit);
        assert.equal(buffs.def, 3);
        assert.equal(buffs.res, 3);
        const { debuffs } = collectMapMods(enemy);
        assert.equal(debuffs.def, -3);
        assert.equal(debuffs.res, -3);
    });

    it("Rogue Dagger+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Matthew: Faithful Spy",
            rarity: 5,
            weapon: "Rogue Dagger+",
            skills: blankKit(),
        }, TEAM_IDS[0], 1);

        unit.addComponent({
            type: "PreventCounterattack"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });
        unit.addComponent({
            type: "Battling"
        });

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Matthew: Faithful Spy",
            rarity: 5,
            weapon: "Rogue Dagger",
            skills: blankKit(),
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const { buffs } = collectMapMods(unit);
        assert.equal(buffs.def, 5);
        assert.equal(buffs.res, 5);
        const { debuffs } = collectMapMods(enemy);
        assert.equal(debuffs.def, -5);
        assert.equal(debuffs.res, -5);
    });

    it("Rowdy Sword", () => {
        const cain = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            skills: blankKit(),
            weapon: "Rowdy Sword",
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(cain.getOne("Stats").spd, level40Stats["Cain: The Bull"].spd.standard - 5);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            weapon: "Rowdy Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        enemy.addComponent({
            type: "Battling"
        });

        enemy.getOne("Stats").hp = 999;

        cain.addComponent({
            type: "InitiateCombat"
        });

        cain.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert(cain.getOne("BraveWeapon"));
        assert(!enemy.getOne("BraveWeapon"));
        const turns = generateTurns(cain, enemy);
        assert.equal(turns[0], cain);
        assert.equal(turns[1], cain);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Ruby Sword", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Ruby Sword",
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

    it("Ruby Sword+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Ruby Sword+",
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

    it("Runeaxe", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Narcian: Wyvern General",
            weapon: "Runeaxe",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Narcian: Wyvern General",
            weapon: "Runeaxe",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "PreventCounterattack"
        });

        enemy.addComponent({
            type: "Battling"
        });

        unit.getOne("Stats").hp = unit.getOne("Stats").hp - 10;
        const curHP = unit.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(unit.getOne("DealDamage").attacker.hp, curHP + 7);
    });
});