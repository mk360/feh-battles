import assert from "node:assert";
import { describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import WEAPONS from "../../data/weapons";
import checkBattleEffectiveness from "../../systems/effectiveness";
import generateTurns from "../../systems/generate-turns";
import getCombatStats from "../../systems/get-combat-stats";
import getMapStats from "../../systems/get-map-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";

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
        staff.addComponent({
            type: "InitiateCombat"
        });
        staff.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
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

        staff.addComponent({
            type: "InitiateCombat"
        });
        staff.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
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

        attacker.addComponent({
            type: "InitiateCombat"
        });
        attacker.addComponent({
            type: "Battling"
        });
        blackKnight.addComponent({
            type: "Battling"
        });
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

        elincia.addComponent({
            type: "InitiateCombat"
        });
        elincia.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
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

        arden.addComponent({
            type: "InitiateCombat"
        });
        arden.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
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

        klein.addComponent({
            type: "InitiateCombat"
        });
        klein.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
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
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const turns2 = generateTurns(opponent2, hector2, getCombatStats(opponent2), getCombatStats(hector2));

        assert.equal(turns2[0], opponent2);
        assert.equal(turns2[1], hector2);
        assert.equal(turns2[2], undefined);

        killUnits([hector, opponent, hector2, opponent2]);
    });

    it("Armorslayer & Armorslayer+", () => {
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
    });

    it("Assassin's Bow & Assassin's Bow+", () => {
        const clarisse = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Assassin's Bow",
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Saizo: Angry Ninja",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Iron Bow",
            rarity: 5
        }, TEAM_IDS[1], 2);

        opponent.getOne("Stats").spd = 99;

        clarisse.addComponent({
            type: "Battling"
        });

        clarisse.addComponent({
            type: "InitiateCombat"
        });
        opponent.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        assert(clarisse.getOne("GuaranteedFollowup"));
        assert(clarisse.getOne("PreventFollowup"));

        const turns = generateTurns(clarisse, opponent, getCombatStats(clarisse), getCombatStats(opponent));

        assert.equal(turns[0], clarisse);
        assert.equal(turns[1], opponent);
        assert.equal(turns[2], clarisse);

        TEST_GAME_WORLD.runSystems("after-combat");

        killUnits([clarisse, opponent]);
    });

    it("Audhulma", () => {
        const joshua = TEST_GAME_WORLD.createHero({
            name: "Joshua: Tempest King",
            weapon: "Audhulma",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "Aether",
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(joshua.getOne("Stats").res, level40Stats["Joshua: Tempest King"].res.standard + 5);

        assert.equal(joshua.getOne("Special").maxCooldown, SPECIALS["Aether"].cooldown - 1);

        killUnits([joshua]);
    });

    it("Aura", () => {
        const linde = TEST_GAME_WORLD.createHero({
            name: "Linde: Light Mage",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Aura",
        }, TEAM_IDS[0], 1);

        const opponent = TEST_GAME_WORLD.createHero({
            name: "Cecilia: Etrurian General",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            weapon: "Gronnblade",
            rarity: 5
        }, TEAM_IDS[1], 2);

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
        }, TEAM_IDS[0], 2);

        ally.getOne("Stats").hp = 1;

        const attackerPosition = linde.getOne("Position") as null as { x: number; y: number };
        ally.getOne("Position").x = attackerPosition.x + 1;
        ally.getOne("Position").y = attackerPosition.y;
        linde.addComponent({
            type: "InitiateCombat"
        });
        linde.addComponent({
            type: "Battling"
        });
        opponent.addComponent({
            type: "Battling"
        });
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(ally.getOne("Stats").hp, 6);

        killUnits([linde, opponent, ally]);
    });

    it("Axe of Virility", () => {
        const bartre = TEST_GAME_WORLD.createHero({
            name: "Bartre: Fearless Warrior",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Axe of Virility",
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

        assert(checkBattleEffectiveness(bartre, opponent));

        killUnits([opponent, bartre]);
    });

    it("Ayra's Blade", () => {
        const ayra = TEST_GAME_WORLD.createHero({
            name: "Ayra: Astra's Wielder",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "Aether",
            },
            rarity: 5,
            weapon: "Ayra's Blade",
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

        ayra.addComponent({
            type: "Battling"
        });

        ayra.addComponent({
            type: "InitiateCombat"
        });
        opponent.addComponent({
            type: "Battling"
        });

        assert.equal(ayra.getOne("Stats").spd, level40Stats["Ayra: Astra's Wielder"].spd.standard + 3);
        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const turns = generateTurns(ayra, opponent, getCombatStats(ayra), getCombatStats(opponent));
        TEST_GAME_WORLD.runSystems("after-combat");

        assert.equal(ayra.getOne("Special").cooldown, Math.max(SPECIALS["Aether"].cooldown - turns.filter((i) => ayra === i).length * 2 - turns.filter((i) => ayra !== i).length, 0));

        killUnits([ayra, opponent]);
    });
});