import { describe, it } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import TEAM_IDS from "../constants/teamIds";
import assert from "assert";
import SPECIALS from "../../data/specials";
import killUnits from "../utils/kill-units";
import getCombatStats from "../../systems/get-combat-stats";
import getMapStats from "../../systems/get-map-stats";
import generateTurns from "../../systems/generate-turns";
import level40Stats from "../constants/lv40_stats.json";
import { applyMapComponent } from "../../systems/apply-map-effect";

describe("B", () => {
    it("Basilikos", () => {
        const raymond = TEST_GAME_WORLD.createHero({
            name: "Raven: Peerless Fighter",
            weapon: "Basilikos",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "Aether",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(raymond.getOne("Special").maxCooldown, SPECIALS[raymond.getOne("Special").name].cooldown - 1);

        killUnits([raymond]);
    });

    it("Berkut's Lance && Berkut's Lance+", () => {
        const berkut1 = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Berkut's Lance",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const berkut2 = TEST_GAME_WORLD.createHero({
            name: "Berkut: Prideful Prince",
            weapon: "Berkut's Lance",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 1);

        const init = berkut1.addComponent({
            type: "InitiateCombat",
        });
        berkut1.addComponent({
            type: "Battling",
        });
        berkut2.addComponent({
            type: "Battling"
        })

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getCombatStats(berkut2).res, getMapStats(berkut2).res + 4);
        berkut1.removeComponent(init);
        berkut2.addComponent({
            type: "InitiateCombat"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        assert.equal(getCombatStats(berkut1).res, getMapStats(berkut1).res + 4);
        TEST_GAME_WORLD.runSystems("after-combat");
        killUnits([berkut1, berkut2]);
    });

    it("Beruka's Axe", () => {
        const beruka = TEST_GAME_WORLD.createHero({
            name: "Beruka: Quiet Assassin",
            weapon: "Beruka's Axe",
            skills: {
                A: "",
                assist: "",
                S: "",
                special: "Aether",
                B: "",
                C: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(beruka.getOne("Special").maxCooldown, SPECIALS[beruka.getOne("Special").name].cooldown - 1);

        killUnits([beruka]);
    });

    it("Blazing Durandal", () => {
        const roy = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5,
            weapon: "Blazing Durandal"
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Iron Sword",
            rarity: 5
        }, TEAM_IDS[1], 2);

        roy.addComponent({
            type: "Battling"
        });

        roy.addComponent({
            type: "InitiateCombat"
        });

        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns = generateTurns(roy, opponent, getCombatStats(roy), getCombatStats(opponent));
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(roy.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns.filter((i) => roy === i).length * 2 - turns.filter((i) => roy !== i).length, 0));

        killUnits([roy]);

        // don't stack with Heavy Blade
        const roy2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "Heavy Blade 3",
                B: "",
                C: "",
                S: "",
                special: "Aether",
                assist: "",
            },
            rarity: 5,
            weapon: "Blazing Durandal"
        }, TEAM_IDS[0], 1);

        roy2.addComponent({
            type: "Battling"
        });

        roy2.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns2 = generateTurns(roy2, opponent, getCombatStats(roy2), getCombatStats(opponent));
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(roy2.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns2.filter((i) => roy2 === i).length * 2 - turns2.filter((i) => roy2 !== i).length, 0));

        killUnits([roy2, opponent]);
    });

    it("Blárblade & Blárblade+", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárblade",
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(robin.getOne("Special").maxCooldown, SPECIALS[robin.getOne("Special").name].cooldown + 1);

        applyMapComponent(robin, "MapBuff", {
            atk: 6,
            def: 7,
            res: 3,
            spd: 2
        });

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Iron Sword",
            rarity: 5
        }, TEAM_IDS[1], 2);

        opponent.addComponent({
            type: "Battling"
        });

        robin.addComponent({
            type: "Battling"
        });

        opponent.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { atk } = combatBuff;

        assert.equal(atk, 6 + 7 + 3 + 2);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([robin]);

        const robin2 = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárblade+",
            rarity: 5
        }, TEAM_IDS[0], 1);

        assert.equal(robin2.getOne("Special").maxCooldown, SPECIALS[robin2.getOne("Special").name].cooldown + 1);

        applyMapComponent(robin2, "MapBuff", {
            atk: 5,
            def: 5,
            res: 0,
            spd: 0
        });

        robin2.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin2.getOne("CombatBuff");
        const { atk: otherAtk } = combatBuff2;

        assert.equal(otherAtk, 10);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([robin2, opponent]);
    });

    it("Blárowl", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárowl",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Urvan",
            rarity: 5
        }, TEAM_IDS[0], 2);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Rexcalibur+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { type, ...stats } = combatBuff.getObject(false);

        assert.deepEqual(stats, {
            atk: 2,
            spd: 2,
            def: 2,
            res: 2
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "",
            rarity: 5,
        }, TEAM_IDS[0], 3);
        ally2.getOne("Position").x = robin.getOne("Position").x;
        ally2.getOne("Position").y = robin.getOne("Position").y + 1;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin.getOne("CombatBuff");
        const { type: type2, ...stats2 } = combatBuff2.getObject(false);

        assert.deepEqual(stats2, {
            atk: 4,
            spd: 4,
            def: 4,
            res: 4
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally1, ally2, robin, opponent]);
    });

    it("Blárowl+", () => {
        const robin = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Blárowl+",
            rarity: 5
        }, TEAM_IDS[0], 1);

        const ally1 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Urvan",
            rarity: 5
        }, TEAM_IDS[0], 2);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Ignis",
                assist: "",
            },
            weapon: "Rexcalibur+",
            rarity: 5
        }, TEAM_IDS[1], 1);

        robin.addComponent({
            type: "InitiateCombat"
        });
        robin.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = robin.getOne("CombatBuff");
        const { type, ...stats } = combatBuff.getObject(false);

        assert.deepEqual(stats, {
            atk: 2,
            spd: 2,
            def: 2,
            res: 2
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        const ally2 = TEST_GAME_WORLD.createHero({
            name: "Roy: Brave Lion",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "",
            rarity: 5,
        }, TEAM_IDS[0], 4);
        ally2.getOne("Position").x = robin.getOne("Position").x;
        ally2.getOne("Position").y = robin.getOne("Position").y + 1;

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff2 = robin.getOne("CombatBuff");
        const { type: type2, ...stats2 } = combatBuff2.getObject(false);

        assert.deepEqual(stats2, {
            atk: 4,
            spd: 4,
            def: 4,
            res: 4
        });

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([ally1, ally2, robin, opponent]);
    });
});