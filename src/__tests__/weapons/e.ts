import assert from "assert";
import { afterEach, describe, it } from "node:test";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import getAffinity from "../../systems/get-affinity";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import getTargetedDefenseStat from "../../systems/get-targeted-defense-stat";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("Weapons in E", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Eckesachs", () => {
        const zephiel = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "Eckesachs",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const pos = zephiel.getOne("Position");

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: pos.x + 1,
            y: pos.y
        }, false);

        TEST_GAME_WORLD.moveUnit(enemy2.id, {
            x: pos.x,
            y: pos.y + 4
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        const mapMods = collectMapMods(enemy1);

        assert(!enemy2.getOne("MapDebuff"));
        assert.equal(mapMods.debuffs.def, -4);
    });

    it("Elena's Staff", () => {
        const mist = TEST_GAME_WORLD.createHero({
            name: "Mist: Helpful Sister",
            weapon: "Elena's Staff",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);
        const pos = mist.getOne("Position");

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Zephiel: The Liberator",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(enemy1.id, {
            x: pos.x + 3,
            y: pos.y + 1,
        }, false);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(enemy2.id, {
            x: pos.x + 3,
            y: pos.y + 2,
        }, false);

        TEST_GAME_WORLD.runSystems("every-turn");

        const debuff = collectMapMods(enemy1);

        assert.equal(debuff.debuffs.atk, -7);
        assert.equal(debuff.debuffs.spd, -7);
        assert(!enemy2.getOne("MapDebuff"));

        enemy2.removeComponent(enemy2.getOne("MapDebuff"));
        enemy2.removeComponent(enemy2.getOne("Status"));
        enemy2.removeTag("Penalty");

        assert.equal(mist.getOne("Stats").res, level40Stats["Mist: Helpful Sister"].res.standard + 3);

        mist.addComponent({
            type: "InitiateCombat",
        });

        mist.addComponent({
            type: "Battling"
        });

        enemy1.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const otherDebuff = collectMapMods(enemy1);
        assert.equal(otherDebuff.debuffs.atk, -7);
        assert.equal(otherDebuff.debuffs.spd, -7);
        assert(enemy2.getOne("MapDebuff"))
    });

    it("Elise's Staff", () => {
        const elise = TEST_GAME_WORLD.createHero({
            name: "Elise: Budding Flower",
            weapon: "Elise's Staff",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Elise: Budding Flower",
            weapon: "",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        assert.equal(elise.getOne("Stats").spd, level40Stats["Elise: Budding Flower"].spd.standard + 3);
        elise.addComponent({
            type: "InitiateCombat"
        });
        enemy1.addComponent({
            type: "Battling"
        });
        elise.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = elise.getOne("DealDamage");
        assert.equal(dealDamage.attacker.damage, getCombatStats(elise).atk - getCombatStats(enemy1).res);
        TEST_GAME_WORLD.runSystems("after-combat");
    });

    for (let grade of ["", "+"]) {
        it(`Emerald Axe${grade}`, () => {
            const axe = TEST_GAME_WORLD.createHero({
                name: "Arthur: Hapless Hero",
                weapon: `Emerald Axe${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 1);

            axe.addComponent({
                type: "Battling"
            });

            axe.addComponent({
                type: "InitiateCombat"
            });

            enemy.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            assert.equal(getAffinity(axe, enemy), -0.2);
            TEST_GAME_WORLD.runSystems("after-combat");
        });
    }

    it("Eternal Breath", () => {
        const breath = TEST_GAME_WORLD.createHero({
            name: "Fae: Divine Dragon",
            weapon: "Eternal Breath",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const pos = breath.getOne("Position");

        const ally = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 2);

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 3);

        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x: pos.x + 3,
            y: pos.y
        }, false);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            weapon: "Gronnblade+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.runSystems("every-turn");
        assert(breath.getOne("MapBuff"));
        assert(ally.getOne("MapBuff"));
        const mapBuffs = collectMapMods(breath);
        assert.equal(mapBuffs.buffs.atk, 5);
        assert.equal(mapBuffs.buffs.spd, 5);
        assert.equal(mapBuffs.buffs.def, 5);
        assert.equal(mapBuffs.buffs.res, 5);
        assert(!ally2.getOne("MapBuff"));

        breath.addComponent({
            type: "InitiateCombat",
        });
        breath.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        assert(breath.getOne("TargetLowestDefense"));
        var a = getTargetedDefenseStat(breath, enemy, getCombatStats(enemy));
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = breath.getOne("DealDamage");
        const combatBreath = getCombatStats(breath);
        const combatDefense = getCombatStats(enemy);
        assert.equal(dealDamage.attacker.damage, (combatBreath.atk - Math.min(combatDefense.def, combatDefense.res)));
    });

    it("Eternal Tome", () => {
        const tome = TEST_GAME_WORLD.createHero({
            name: "Sophia: Nabata Prophet",
            weapon: "Eternal Tome",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            weapon: "Iron Dagger",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        tome.addComponent({
            type: "Battling"
        });

        tome.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        assert.equal(getAttackerAdvantage(tome, enemy), 0.2);
    });

    it("Excalibur", () => {
        const tome = TEST_GAME_WORLD.createHero({
            name: "Merric: Wind Mage",
            weapon: "Excalibur",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Elincia: Lost Princess",
            weapon: "Amiti",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        tome.addComponent({
            type: "Battling"
        });

        tome.addComponent({
            type: "InitiateCombat"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");

        assert(checkBattleEffectiveness(tome, enemy));
    });
});