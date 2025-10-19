import { Component } from "ape-ecs";
import assert from "node:assert";
import { after, describe, it } from "node:test";
import generateTurns from "../../systems/generate-turns";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("generate-turns", () => {
    const hero1 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        skills: blankKit()
    }, TEST_GAME_WORLD.state.teamIds[0], 1);

    const hero2 = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        weapon: "Sieglinde",
        rarity: 5,
        skills: blankKit()
    }, TEST_GAME_WORLD.state.teamIds[1], 1);

    const hero3 = TEST_GAME_WORLD.createHero({
        rarity: 5,
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: blankKit()
    }, TEST_GAME_WORLD.state.teamIds[1], 2);

    after(() => killUnits([hero1, hero2, hero3]));

    it("should generate a single turn for each in case of a mirror match", () => {
        const turns = generateTurns(hero1, hero2);

        assert.strictEqual(turns.length, 2);
        assert.strictEqual(turns.indexOf(hero1), 0);
        assert.strictEqual(turns.indexOf(hero2), 1);
    });

    it("should prevent a defender from fighting back if ranges don't match", () => {
        const turns = generateTurns(hero3, hero1);
        assert.strictEqual(turns.length, 1);
        assert.strictEqual(turns.indexOf(hero1), -1);
    });

    it("should allow a defender to fight back if they have a Counterattack component", () => {
        const cmp = hero2.addComponent({
            type: "Counterattack"
        }) as Component;
        const turns = generateTurns(hero3, hero2);
        assert.strictEqual(turns.length, 2);
        assert.strictEqual(turns[1], hero2);
        hero2.removeComponent(cmp);
    });

    it("should generate two turns with a Brave weapon", () => {
        const cmp = hero1.addComponent({
            type: "BraveWeapon"
        }) as Component;

        const turns = generateTurns(hero1, hero2);
        assert.strictEqual(turns[0], hero1);
        assert.strictEqual(turns[1], hero1);
        assert.strictEqual(turns[2], hero2);
        hero1.removeComponent(cmp);
    });

    it("should prevent a followup on a hero if the proper component is applied", () => {
        const cmp = hero1.addComponent({
            type: "PreventFollowup"
        }) as Component;

        hero2.getOne("Stats")!.spd += 10;

        const turns = generateTurns(hero1, hero2);
        assert.strictEqual(turns[0], hero1);
        assert.strictEqual(turns[1], hero2);

        hero1.removeComponent(cmp);
        hero2.getOne("Stats")!.spd -= 10;

        hero2.addComponent({
            type: "PreventFollowup"
        }) as Component;

        hero1.getOne("Stats")!.spd += 10;

        const turns2 = generateTurns(hero1, hero2);
        assert.strictEqual(turns2[0], hero1);
        assert.strictEqual(turns2[1], hero2);

        hero2.removeComponent(cmp);
        hero1.getOne("Stats")!.spd -= 10;
    });

    it("should guarantee a followup if the proper component is applied", () => {
        hero1.addComponent({
            type: "GuaranteedFollowup"
        }) as Component;

        hero1.getOne("Stats").spd = 0;
        hero2.getOne("Stats").spd = 90;

        const turns = generateTurns(hero1, hero2);
        assert.strictEqual(turns[0], hero1);
        assert.strictEqual(turns[1], hero2);
        assert.strictEqual(turns[2], hero1);
        assert.strictEqual(turns[3], hero2);
    });

    it("should generate 4 consecutive turns if a Brave Weapon can follow-up", () => {
        hero1.getOne("Stats").spd = 90;
        hero2.getOne("Stats").spd = 0;
        hero1.addComponent({
            type: "BraveWeapon"
        });

        const turns = generateTurns(hero1, hero2);

        assert.strictEqual(turns[0], hero1);
        assert.strictEqual(turns[1], hero1);
        assert.strictEqual(turns[2], hero2);
        assert.strictEqual(turns[3], hero1);
        assert.strictEqual(turns[4], hero1);
    });
});