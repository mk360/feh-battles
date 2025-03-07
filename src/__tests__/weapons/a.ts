import assert from "node:assert";
import { describe, it } from "node:test";
import generateTurns from "../../systems/generate-turns";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";
import checkBattleEffectiveness from "../../systems/effectiveness";
import getMapStats from "../../systems/get-map-stats";
import WEAPONS from "../../data/weapons";

describe("A", () => {
    it("Absorb", () => {
        const staff = TEST_GAME_WORLD.createHero({
            name: "Priscilla: Delicate Princess",
            skills: {
                A: "",
                assist: "",
                B: "Wrathful Staff 3",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Absorb",
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
        const attackerPosition = staff.getOne("Position") as null as { x: number; y: number };
        staff.addComponent({
            type: "InitiateCombat"
        });
        staff.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.moveUnit(opponent.id, { x: attackerPosition.x + 1, y: attackerPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const dealDamage = staff.getOne("DealDamage");
        assert.equal(dealDamage.attacker.heal, Math.floor(dealDamage.attacker.damage / 2));

        killUnits([staff, opponent]);
    });

    it("Absorb+", () => {
        const staff = TEST_GAME_WORLD.createHero({
            name: "Priscilla: Delicate Princess",
            skills: {
                A: "",
                assist: "",
                B: "Wrathful Staff 3",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Absorb+",
        }, TEAM_IDS[0], 1);

        const ally = TEST_GAME_WORLD.createHero({
            name: "Lucina: Future Witness",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Silver Sword+",
        }, TEAM_IDS[0], 3);

        ally.getOne("Stats").hp = 1;

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
        const attackerPosition = staff.getOne("Position") as null as { x: number; y: number };
        staff.addComponent({
            type: "InitiateCombat"
        });
        staff.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.moveUnit(opponent.id, { x: attackerPosition.x + 1, y: attackerPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const dealDamage = staff.getOne("DealDamage");
        assert.equal(dealDamage.attacker.heal, Math.floor(dealDamage.attacker.damage / 2));
        assert.equal(ally.getOne("Stats").hp, 8);

        killUnits([staff, opponent, ally]);
    });

    it("Alondite", () => {
        const blackKnight = TEST_GAME_WORLD.createHero({
            name: "Black Knight: Sinister General",
            weapon: "Alondite",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const attacker = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            weapon: "Brave Bow+",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const attackerPosition = attacker.getOne("Position") as null as { x: number; y: number };
        attacker.addComponent({
            type: "InitiateCombat"
        });
        attacker.addComponent({
            type: "Battling"
        });
        blackKnight.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.moveUnit(blackKnight.id, { x: attackerPosition.x + 1, y: attackerPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        const dealDamage = blackKnight.getOne("DealDamage");
        assert(dealDamage);

        killUnits([blackKnight, attacker]);
    });

    it("Amiti", () => {
        const elincia = TEST_GAME_WORLD.createHero({
            name: "Elincia: Lost Princess",
            skills: {
                A: "",
                assist: "",
                B: "Wrathful Staff 3",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Amiti",
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

        assert.equal(elincia.getOne("Stats").spd, level40Stats["Elincia: Lost Princess"].spd.standard - 2);

        const attackerPosition = elincia.getOne("Position") as null as { x: number; y: number };
        elincia.addComponent({
            type: "InitiateCombat"
        });
        elincia.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: attackerPosition.x + 1, y: attackerPosition.y }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const turns = generateTurns(elincia, opponent, getCombatStats(elincia), getCombatStats(opponent));
        assert(elincia.getOne("BraveWeapon"));

        assert.equal(turns[0], elincia);
        assert.equal(turns[1], elincia);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([elincia, opponent]);
    });

    it("Arden's Blade", () => {
        const arden = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Arden's Blade",
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
            weapon: "Arden's Blade",
            rarity: 5
        }, TEAM_IDS[1], 2);

        assert.equal(arden.getOne("Stats").spd, level40Stats["Arden: Strong and Tough"].spd.standard - 5);

        const attackerPosition = arden.getOne("Position") as null as { x: number; y: number };
        arden.addComponent({
            type: "InitiateCombat"
        });
        arden.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: attackerPosition.x + 1, y: attackerPosition.y }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const turns = generateTurns(arden, opponent, getCombatStats(arden), getCombatStats(opponent));
        assert(arden.getOne("BraveWeapon"));
        assert(opponent.getOne("BraveWeapon"));

        assert.equal(turns[0], arden);
        assert.equal(turns[1], arden);
        assert.equal(turns[2], opponent);
        assert.equal(turns[3], opponent);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([arden, opponent]);
    });

    it("Argent Bow", () => {
        const klein = TEST_GAME_WORLD.createHero({
            name: "Klein: Silver Nobleman",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Argent Bow",
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
            weapon: "Arden's Blade",
            rarity: 5
        }, TEAM_IDS[1], 2);

        assert.equal(klein.getOne("Stats").spd, level40Stats["Klein: Silver Nobleman"].spd.standard - 2);

        const attackerPosition = klein.getOne("Position") as null as { x: number; y: number };
        klein.addComponent({
            type: "InitiateCombat"
        });
        klein.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: attackerPosition.x + 1, y: attackerPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const turns = generateTurns(klein, opponent, getCombatStats(klein), getCombatStats(opponent));

        assert(klein.getOne("BraveWeapon"));

        assert.equal(turns[0], klein);
        assert.equal(turns[1], klein);
        assert.equal(turns[2], klein);
        assert.equal(turns[3], klein);
        assert(!turns.includes(opponent));

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([klein, opponent]);
    });

    it("Armads", () => {
        const hector = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Armads",
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
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        const defenderPosition = hector.getOne("Position") as null as { x: number; y: number };
        hector.addComponent({
            type: "Battling"
        });

        opponent.addComponent({
            type: "InitiateCombat"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: defenderPosition.x + 1, y: defenderPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(hector.getOne("GuaranteedFollowup"));

        const turns = generateTurns(opponent, hector, getCombatStats(opponent), getCombatStats(hector));

        assert.equal(turns[0], opponent);
        assert.equal(turns[1], hector);
        assert.equal(turns[2], hector);

        TEST_GAME_WORLD.runSystems("after-combat");

        const hector2 = TEST_GAME_WORLD.createHero({
            name: "Hector: General of Ostia",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Armads",
        }, TEAM_IDS[0], 3);

        hector2.getOne("Stats").hp = 100;
        hector2.getOne("Stats").maxHP = 999;

        const opponent2 = TEST_GAME_WORLD.createHero({
            name: "Arden: Strong and Tough",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 4);

        opponent2.getOne("Stats").spd = hector2.getOne("Stats").spd;

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: defenderPosition.x + 1, y: defenderPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const turns2 = generateTurns(opponent2, hector2, getCombatStats(opponent2), getCombatStats(hector2));

        assert.equal(turns2[0], opponent2);
        assert.equal(turns2[1], hector2);
        assert.equal(turns2[2], undefined);

        killUnits([hector, opponent, hector2, opponent2]);
    });

    it("Armorslayer", () => {
        const gray = TEST_GAME_WORLD.createHero({
            name: "Gray: Wry Comrade",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Armorslayer",
        }, TEAM_IDS[0], 1);

        const gray2 = TEST_GAME_WORLD.createHero({
            name: "Gray: Wry Comrade",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Armorslayer+",
        }, TEAM_IDS[0], 2);

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
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        assert(checkBattleEffectiveness(gray, opponent));
        assert(checkBattleEffectiveness(gray2, opponent));

        killUnits([gray, opponent, gray2]);
    });

    it("Arthur's Axe", () => {
        const arthur = TEST_GAME_WORLD.createHero({
            name: "Arthur: Hapless Hero",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Arthur's Axe",
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
            weapon: "Silver Sword+",
            rarity: 5
        }, TEAM_IDS[1], 2);

        const defenderPosition = arthur.getOne("Position") as null as { x: number; y: number };
        arthur.addComponent({
            type: "Battling"
        });

        opponent.addComponent({
            type: "InitiateCombat"
        });
        opponent.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.moveUnit(opponent.id, { x: defenderPosition.x + 1, y: defenderPosition.y + 1 }, false);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatStats = getCombatStats(arthur);
        assert.deepEqual(combatStats, getMapStats(arthur));

        arthur.addComponent({
            type: "MapBuff",
            atk: 5
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const combatBuff = arthur.getOne("CombatBuff");
        assert.equal(combatBuff.atk, 3);
        assert.equal(combatBuff.spd, 3);
        assert.equal(combatBuff.def, 3);
        assert.equal(combatBuff.res, 3);

        killUnits([arthur, opponent]);
    });

    it("Assault", () => {
        const staff = TEST_GAME_WORLD.createHero({
            name: "Priscilla: Delicate Princess",
            skills: {
                A: "",
                assist: "",
                B: "Wrathful Staff 3",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Assault",
        }, TEAM_IDS[0], 1);

        assert.equal(staff.getOne("Stats").atk, level40Stats["Priscilla: Delicate Princess"].atk.standard + WEAPONS["Assault"].might);

        killUnits([staff]);
    })
});