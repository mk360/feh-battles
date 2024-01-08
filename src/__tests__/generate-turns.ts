import generateTurns from "../systems/generate-turns";
import getCombatStats from "../systems/get-combat-stats";
import TEST_GAME_WORLD from "./constants/world";

describe("generate-turns", () => {
    const hero1 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3,
        },
        skills: {
            A: null,
            B: null,
            C: null,
            assist: null,
            S: null,
            special: null,
        }
    }, "team1");

    const hero2 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3,
        },
        skills: {
            A: null,
            B: null,
            C: null,
            assist: null,
            S: null,
            special: null,
        }
    }, "team2");

    const hero3 = TEST_GAME_WORLD.createHero({
        initialPosition: {
            x: 5,
            y: 7,
        },
        rarity: 5,
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: null,
            S: null,
        }
    }, "team2");

    it("should generate a single turn for each in case of a mirror match", () => {
        const stats1 = getCombatStats(hero1);
        const stats2 = getCombatStats(hero2);
        const turns = generateTurns(hero1, hero2, stats1, stats2);

        expect(turns.length).toEqual(2);
        expect(turns[0]).toEqual(hero1);
        expect(turns[1]).toEqual(hero2);
    });

    it("should prevent a defender from fighting back if ranges don't match", () => {
        const turns = generateTurns(hero3, hero1, getCombatStats(hero3), getCombatStats(hero1));
        expect(turns.length).toEqual(1);
        expect(turns).not.toContain(hero1);
    });

    it("should allow a defender to fight back if they have a Counterattack component", () => {
        const cmp = hero2.addComponent({
            type: "Counterattack"
        });
        const turns = generateTurns(hero3, hero2, getCombatStats(hero3), getCombatStats(hero2));
        expect(turns.length).toEqual(2);
        expect(turns[1]).toEqual(hero2);
        hero2.removeComponent(cmp);
    });
});