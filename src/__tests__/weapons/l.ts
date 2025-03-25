import assert from "assert";
import { afterEach, describe, it } from "node:test";
import collectCombatMods from "../../systems/collect-combat-mods";
import collectMapMods from "../../systems/collect-map-mods";
import checkBattleEffectiveness from "../../systems/effectiveness";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";
import SPECIALS from "../../data/specials";

describe("L", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Laid-Back Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gray: Wry Comrade",
            rarity: 5,
            skills: blankKit(),
            weapon: "Laid-Back Blade"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Cain: The Bull",
            rarity: 5,
            skills: blankKit(),
            weapon: "Brave Sword+"
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));

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
        const mods = collectCombatMods(unit);
        assert.equal(mods.atk, 3);
        assert.equal(mods.spd, 3);
        assert.equal(mods.def, 3);
        assert.equal(mods.res, 3);
    });

    it("Laslow's Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Laslow: Dancing Duelist",
            rarity: 5,
            skills: {
                ...blankKit(),
                assist: "Reposition"
            },
            weapon: "Laslow's Blade"
        }, TEAM_IDS[0], 1);
        const { x, y } = unit.getOne("Position");

        const ally = TEST_GAME_WORLD.createHero({
            name: "Laslow: Dancing Duelist",
            rarity: 5,
            skills: blankKit(),
            weapon: "Laslow's Blade"
        }, TEAM_IDS[0], 2);

        const { x: allyX, y: allyY } = ally.getOne("Position");

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Laslow: Dancing Duelist",
            rarity: 5,
            skills: blankKit(),
            weapon: "Iron Sword"
        }, TEAM_IDS[0], 3);

        const ally3 = TEST_GAME_WORLD.createHero({
            name: "Laslow: Dancing Duelist",
            rarity: 5,
            skills: blankKit(),
            weapon: "Iron Sword"
        }, TEAM_IDS[0], 4);

        TEST_GAME_WORLD.moveUnit(ally2.id, {
            x: x + 1,
            y: y + 1
        }, false);

        unit.addComponent({
            type: "Assisting"
        });

        ally.addComponent({
            type: "Assisted"
        });

        TEST_GAME_WORLD.runSystems("assist");

        assert(unit.getOne("MapBuff"));
        assert(ally.getOne("MapBuff"));
        assert(ally2.getOne("MapBuff"));
        assert(!ally3.getOne("MapBuff"));
    });

    for (let grade of ["", "+"]) {
        it(`Legion's Axe${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                rarity: 5,
                skills: blankKit(),
                weapon: `Legion's Axe${grade}`
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cain: The Bull",
                rarity: 5,
                skills: blankKit(),
                weapon: "Brave Sword+"
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

        it(`Light Breath${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Fae: Divine Dragon",
                rarity: 5,
                skills: blankKit(),
                weapon: `Light Breath${grade}`
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Fae: Divine Dragon",
                rarity: 5,
                skills: blankKit(),
                weapon: `Light Breath${grade}`
            }, TEAM_IDS[1], 1);

            const unitAlly = TEST_GAME_WORLD.createHero({
                name: "Fae: Divine Dragon",
                rarity: 5,
                skills: blankKit(),
                weapon: `Light Breath${grade}`
            }, TEAM_IDS[0], 2);

            const enemyAlly = TEST_GAME_WORLD.createHero({
                name: "Fae: Divine Dragon",
                rarity: 5,
                skills: blankKit(),
                weapon: `Light Breath${grade}`
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

            assert(!enemyAlly.getOne("MapBuff"));
            const { buffs } = collectMapMods(unitAlly);
            assert.equal(buffs.def, 4);
            assert.equal(buffs.res, 4);
        });

        it(`Lightning Breath${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Tiki: Naga's Voice",
                rarity: 5,
                skills: {
                    ...blankKit(),
                    special: "Moonbow"
                },
                weapon: `Lightning Breath${grade}`
            }, TEAM_IDS[0], 1);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cain: The Bull",
                rarity: 5,
                skills: blankKit(),
                weapon: "Brave Sword+"
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
        });

        it(`Lilith Floatie${grade}`, () => {
            const unit = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                rarity: 5,
                skills: blankKit(),
                weapon: `Lilith Floatie${grade}`
            }, TEAM_IDS[0], 1);

            const unitAlly = TEST_GAME_WORLD.createHero({
                name: "Ike: Brave Mercenary",
                rarity: 5,
                skills: blankKit(),
                weapon: "Brave Axe+"
            }, TEAM_IDS[0], 2);

            const enemy = TEST_GAME_WORLD.createHero({
                name: "Cain: The Bull",
                rarity: 5,
                skills: blankKit(),
                weapon: "Brave Sword+"
            }, TEAM_IDS[1], 1);

            unitAlly.addComponent({
                type: "Battling"
            });
            unitAlly.addComponent({
                type: "InitiateCombat"
            });
            enemy.addComponent({
                type: "Battling"
            });

            TEST_GAME_WORLD.runSystems("before-combat");
            const buffs = collectCombatMods(unitAlly);
            assert.equal(buffs.atk, 1);
            assert.equal(buffs.spd, 1);
        });
    }

    it("Lordly Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Clive: Idealistic Knight",
            rarity: 5,
            skills: blankKit(),
            weapon: "Lordly Lance"
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            rarity: 5,
            skills: blankKit(),
            weapon: "Iron Sword"
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Loyal Greatlance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Oscar: Agile Horseman",
            rarity: 5,
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            weapon: "Loyal Greatlance"
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").cooldown, SPECIALS.Aether.cooldown - 1);
    });
});