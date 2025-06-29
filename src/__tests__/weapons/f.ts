import { describe, it, afterEach } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import TEAM_IDS from "../constants/teamIds";
import assert from "assert";
import killUnits from "../utils/kill-units";
import collectMapMods from "../../systems/collect-map-mods";
import getCombatStats from "../../systems/get-combat-stats";
import generateTurns from "../../systems/generate-turns";
import checkBattleEffectiveness from "../../systems/effectiveness";
import { removeStatuses } from "../../systems/apply-map-effect";

describe("Weapons in F", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });
    it("Falchions", () => {
        const alm = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Falchion (Gaiden)",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        alm.getOne("Stats").hp = 1;

        const chrom = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            weapon: "Falchion (Awakening)",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 2);

        chrom.getOne("Stats").hp = 1;

        const lucina = TEST_GAME_WORLD.createHero({
            name: "Lucina: Future Witness",
            weapon: "Falchion (Awakening)",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 3);

        lucina.getOne("Stats").hp = 1;

        const marth = TEST_GAME_WORLD.createHero({
            name: "Marth: Altean Prince",
            weapon: "Falchion (Mystery)",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 4);

        marth.getOne("Stats").hp = 1;

        TEST_GAME_WORLD.state.turn = 3;
        TEST_GAME_WORLD.runSystems("every-turn");
        TEST_GAME_WORLD.state.turn = 1;
        assert.equal(lucina.getOne("Stats").hp, 11);
        assert.equal(marth.getOne("Stats").hp, 11);
        assert.equal(chrom.getOne("Stats").hp, 11);
        assert.equal(alm.getOne("Stats").hp, 11);
    });

    it("Fear", () => {
        const genny = TEST_GAME_WORLD.createHero({
            name: "Genny: Endearing Ally",
            weapon: "Fear",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const enemy = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        genny.addComponent({
            type: "InitiateCombat",
        });
        genny.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const mapDebuff = collectMapMods(enemy);
        assert.equal(mapDebuff.debuffs.atk, -6);
    });

    it("Fear+", () => {
        const genny = TEST_GAME_WORLD.createHero({
            name: "Genny: Endearing Ally",
            weapon: "Fear+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const enemy = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        genny.addComponent({
            type: "InitiateCombat",
        });
        genny.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const mapDebuff = collectMapMods(enemy);
        assert.equal(mapDebuff.debuffs.atk, -7);
        const allyMapDebuff = collectMapMods(enemyAlly);
        assert.equal(allyMapDebuff.debuffs.atk, -7);
    });

    it("Felicia's Plate", () => {
        const felicia = TEST_GAME_WORLD.createHero({
            name: "Felicia: Maid Mayhem",
            weapon: "Felicia's Plate",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const enemy = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const enemyAlly = TEST_GAME_WORLD.createHero({
            name: "Alm: Hero of Prophecy",
            weapon: "Silver Sword+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        felicia.addComponent({
            type: "InitiateCombat",
        });
        felicia.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const dealDamage = felicia.getOne("DealDamage");
        const defStats = getCombatStats(enemy);
        assert.equal(dealDamage.attacker.damage, getCombatStats(felicia).atk - Math.min(defStats.def, defStats.res));
        TEST_GAME_WORLD.runSystems("after-combat");

        const mapDebuff = collectMapMods(enemy);
        assert.equal(mapDebuff.debuffs.def, -7);
        assert.equal(mapDebuff.debuffs.res, -7);
        const allyMapDebuff = collectMapMods(enemyAlly);
        assert.equal(allyMapDebuff.debuffs.def, -7);
        assert.equal(allyMapDebuff.debuffs.res, -7);
    });

    for (let grade of ["", "+"]) {
        it(`Firesweep Bow${grade}`, () => {
            const bow1 = TEST_GAME_WORLD.createHero({
                name: "Klein: Silver Nobleman",
                weapon: `Firesweep Bow${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const bow2 = TEST_GAME_WORLD.createHero({
                name: "Klein: Silver Nobleman",
                weapon: `Firesweep Bow${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[1], 1);

            const c1 = bow1.addComponent({
                type: "InitiateCombat"
            });
            bow1.addComponent({
                type: "Battling"
            });
            bow2.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");

            const turns = generateTurns(bow1, bow2);
            assert.equal(turns[0], bow1);
            assert.equal(turns[1], undefined);
            bow1.removeComponent(c1);
            bow2.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("after-combat");

            TEST_GAME_WORLD.runSystems("before-combat");
            const turns2 = generateTurns(bow2, bow1);
            assert.equal(turns2[0], bow2);
            assert.equal(turns2[1], undefined);

            TEST_GAME_WORLD.runSystems("after-combat");
        });

        it(`Firesweep Lance${grade}`, () => {
            const lance1 = TEST_GAME_WORLD.createHero({
                name: "Abel: The Panther",
                weapon: `Firesweep Lance${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const lance2 = TEST_GAME_WORLD.createHero({
                name: "Abel: The Panther",
                weapon: `Firesweep Lance${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[1], 1);

            const c1 = lance1.addComponent({
                type: "InitiateCombat"
            });
            lance1.addComponent({
                type: "Battling"
            });
            lance2.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");

            const turns = generateTurns(lance1, lance2);
            assert.equal(turns[0], lance1);
            assert.equal(turns[1], undefined);
            lance1.removeComponent(c1);
            lance2.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("after-combat");

            TEST_GAME_WORLD.runSystems("before-combat");
            const turns2 = generateTurns(lance2, lance1);
            assert.equal(turns2[0], lance2);
            assert.equal(turns2[1], undefined);

            TEST_GAME_WORLD.runSystems("after-combat");
        });

        it(`First Bite${grade}`, () => {
            const lance1 = TEST_GAME_WORLD.createHero({
                name: "Charlotte: Money Maiden",
                weapon: `First Bite${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const lance2 = TEST_GAME_WORLD.createHero({
                name: "Charlotte: Money Maiden",
                weapon: `First Bite${grade}`,
                skills: blankKit(),
                rarity: 5,
            }, TEAM_IDS[1], 1);

            const c1 = lance1.addComponent({
                type: "InitiateCombat"
            });
            lance1.addComponent({
                type: "Battling"
            });
            lance2.addComponent({
                type: "Battling"
            });

            const ally1 = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[0], 2);

            const ally2 = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                weapon: "",
                skills: blankKit(),
                rarity: 5
            }, TEAM_IDS[1], 2);

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");
            const mapBuff = ally1.getOne("MapBuff");
            assert.equal(mapBuff.def, 2);
            assert.equal(mapBuff.res, 2);
            assert(!ally2.getOne("MapBuff"));
            ally1.removeComponent(mapBuff);
            lance1.removeComponent(c1);
            lance2.addComponent({
                type: "InitiateCombat"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            TEST_GAME_WORLD.runSystems("combat");
            TEST_GAME_WORLD.runSystems("after-combat");
            const mapBuff2 = ally2.getOne("MapBuff");
            assert.equal(mapBuff2.def, 2);
            assert.equal(mapBuff2.res, 2);
        });
    }

    it("Florina's Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Florina: Lovely Flier",
            rarity: 5,
            skills: blankKit(),
            weapon: "Florina's Lance"
        }, TEAM_IDS[0], 1);

        const armored = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            rarity: 5,
            skills: blankKit(),
            weapon: "Iron Sword"
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, armored));
    });

    it("Forblaze", () => {
        TEST_GAME_WORLD.createHero({
            name: "Lilina: Delightful Noble",
            rarity: 5,
            skills: blankKit(),
            weapon: "Forblaze"
        }, TEAM_IDS[0], 1);

        const enemy1 = TEST_GAME_WORLD.createHero({
            name: "Florina: Lovely Flier",
            rarity: 5,
            skills: blankKit(),
            weapon: "Florina's Lance"
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Florina: Lovely Flier",
            rarity: 5,
            skills: blankKit(),
            weapon: "Florina's Lance"
        }, TEAM_IDS[1], 2);
        enemy2.getOne("Stats").res++;

        TEST_GAME_WORLD.runSystems("every-turn");

        const mapDebuff = enemy2.getOne("MapDebuff");
        assert.equal(mapDebuff.res, -7);
        assert(!enemy1.getOne("MapBuff"));
        removeStatuses(enemy2, "Penalty");
        enemy2.getOne("Stats").res--;
        TEST_GAME_WORLD.runSystems("every-turn");
        const otherMapDebuff = enemy2.getOne("MapDebuff");
        assert.equal(otherMapDebuff.res, -7);
        const otherEnemyDebuff = enemy1.getOne("MapDebuff");
        assert.equal(otherEnemyDebuff.res, -7);
    });

    it("Fujin Yumi", () => {
        const takumi = TEST_GAME_WORLD.createHero({
            name: "Takumi: Wild Card",
            weapon: "Fujin Yumi",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);
        const { x, y } = takumi.getOne("Position");

        TEST_GAME_WORLD.runSystems("every-turn");

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Takumi: Wild Card",
            weapon: "Fujin Yumi",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.moveUnit(enemy.id, {
            x: x,
            y: y + 1
        }, false);

        takumi.addComponent({
            type: "Movable",
        });

        TEST_GAME_WORLD.runSystems("movement");
        const movement = Array.from(takumi.getComponents("MovementTile"));
        assert(movement.find((tile) => tile.y === y + 2 && tile.x === x));
    });
});