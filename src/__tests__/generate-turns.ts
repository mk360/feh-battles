import { Component } from "ape-ecs";
import generateTurns from "../systems/generate-turns";
import getCombatStats from "../systems/get-combat-stats";
import TEST_GAME_WORLD from "./constants/world";

describe("generate-turns", () => {
    const hero1 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        skills: {
            A: "",
            B: "",
            C: "",
            assist: "",
            S: "",
            special: "",
        }
    }, "team1", 1);

    const hero2 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        skills: {
            A: "",
            B: "",
            C: "",
            assist: "",
            S: "",
            special: "",
        }
    }, "team2", 1);

    const hero3 = TEST_GAME_WORLD.createHero({
        rarity: 5,
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: {
            assist: "",
            special: "",
            A: "",
            B: "",
            C: "",
            S: "",
        }
    }, "team2", 2);

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
        }) as Component;
        const turns = generateTurns(hero3, hero2, getCombatStats(hero3), getCombatStats(hero2));
        expect(turns.length).toEqual(2);
        expect(turns[1]).toEqual(hero2);
        hero2.removeComponent(cmp);
    });

    it("should generate two turns with a Brave weapon", () => {
        const cmp = hero1.addComponent({
            type: "BraveWeapon"
        }) as Component;

        const turns = generateTurns(hero1, hero2, getCombatStats(hero1), getCombatStats(hero2));
        expect(turns[0]).toEqual(hero1);
        expect(turns[1]).toEqual(hero1);
        expect(turns[2]).toEqual(hero2);
        hero1.removeComponent(cmp);
    });
});