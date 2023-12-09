import generateTurns from "../systems/generate-turns";
import getCombatStats from "../systems/get-combat-stats";
import GameWorld from "../world";

describe("generate-turns", () => {
    const world = new GameWorld();
    const hero1 = world.createHero({
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

    const hero2 = world.createHero({
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

    it("should generate a single turn for each in case of a mirror match", () => {
        const stats1 = getCombatStats(hero1);
        const stats2 = getCombatStats(hero2);
        const turns = generateTurns(hero1, hero2, stats1, stats2);

        expect(turns.length).toEqual(2);
        expect(turns[0]).toEqual(hero1);
        expect(turns[1]).toEqual(hero2);
    });
});