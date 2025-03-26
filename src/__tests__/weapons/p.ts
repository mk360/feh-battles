import assert from "assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getAffinity from "../../systems/get-affinity";
import getCombatStats from "../../systems/get-combat-stats";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("P", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Pain", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain",
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
        const hp = enemy.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(enemy.getOne("Stats").hp, hp - 10);
    });

    it("Pain+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain+",
            skills: blankKit(),
            rarity: 5
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
        const hp = enemy.getOne("Stats").hp;
        const allyHP = enemyAlly.getOne("Stats").hp;
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(enemy.getOne("Stats").hp, hp - 10);
        assert.equal(enemyAlly.getOne("Stats").hp, allyHP - 10);
    });

    it("Panic", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Panic",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain",
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
        assert(enemy.getOne("PanicComponent"));
    });

    it("Panic+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Panic+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Panic+",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Azama: Carefree Monk",
            weapon: "Pain+",
            skills: blankKit(),
            rarity: 5
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
        assert(enemy.getOne("PanicComponent"));
        assert(enemyAlly.getOne("PanicComponent"));
    });

    it("Panther Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Abel: The Panther",
            weapon: "Panther Lance",
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

        const ally3 = TEST_GAME_WORLD.createHero({
            name: "Julia: Naga's Blood",
            weapon: "Naga",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 4);

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
        assert.equal(combatBuffs.atk, 4);
        assert.equal(combatBuffs.def, 4);
        TEST_GAME_WORLD.runSystems("after-combat");

        TEST_GAME_WORLD.moveUnit(ally3.id, {
            x,
            y: y + 1
        }, false);

        TEST_GAME_WORLD.runSystems("before-combat");
        const otherCombatBuffs = collectCombatMods(unit);
        assert.equal(otherCombatBuffs.atk, 6);
        assert.equal(otherCombatBuffs.def, 6);
    });

    it("Panther Sword", () => {
        const sword = TEST_GAME_WORLD.createHero({
            name: "Stahl: Viridian Knight",
            weapon: "Panther Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Oboro: Fierce Fighter",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        sword.addComponent({
            type: "Battling"
        });

        sword.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getAffinity(sword, enemy), -0.2);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    it("Parthia", () => {
        const bow = TEST_GAME_WORLD.createHero({
            name: "Jeorge: Perfect Shot",
            weapon: "Parthia",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Jeorge: Perfect Shot",
            weapon: "Parthia",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        bow.addComponent({
            type: "Battling"
        });

        bow.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        assert(!enemy.getOne("CombatBuff"));
        const buffs = collectCombatMods(bow);
        assert.equal(buffs.res, 4);
    });

    for (let grade of ["", "+"]) {
        it(`Poison Dagger${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Kagero: Honorable Ninja",
                weapon: `Poison Dagger${grade}`,
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Lilina: Delightful Noble",
                weapon: "Forblaze",
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

            assert(checkBattleEffectiveness(unit, enemy));
            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");
            const { debuffs } = collectMapMods(enemy);
            assert.equal(debuffs.def, -4);
            assert.equal(debuffs.res, -4);
        });
    }

    it("Purifying Breath", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Nowi: Eternal Youth",
            weapon: "Purifying Breath",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS.Aether.cooldown + 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Reinhardt: Thunder's Fist",
            weapon: "Dire Thunder",
            rarity: 5,
            skills: blankKit(),
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
        const enemyCombatStats = getCombatStats(enemy);
        const combatStats = getCombatStats(unit);
        const turns = generateTurns(enemy, unit);
        assert.equal(turns[2], unit);
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = unit.getOne("DealDamage");
        assert.equal(dealDamage.attacker.damage, combatStats.atk - Math.min(enemyCombatStats.def, enemyCombatStats.res));
    });
});