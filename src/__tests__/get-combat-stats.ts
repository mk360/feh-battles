import { Component } from "ape-ecs";
import CHARACTERS from "../data/characters";
import getCombatStats from "../systems/get-combat-stats";
import getLv40Stats from "../systems/unit-stats";
import TEST_GAME_WORLD from "./constants/world";
import { after, describe, it } from "node:test";
import assert from "node:assert";
import killUnits from "./utils/kill-units";

describe("get-combat-stats", () => {
    const dexData = CHARACTERS["Ryoma: Peerless Samurai"];
    const entity = TEST_GAME_WORLD.createHero({
        name: "Ryoma: Peerless Samurai",
        rarity: 5,
        weapon: "",
        skills: {
            assist: "",
            special: "",
            A: "",
            B: "",
            C: "",
            S: ""
        }
    }, TEST_GAME_WORLD.state.teamIds[0], 4);

    after(killUnits([entity]));

    it("should match level 40 stats if no modifier is applied", () => {
        const { hp, ...rest } = getLv40Stats(dexData.stats, dexData.growthRates, 5);
        const combatStats = getCombatStats(entity);

        assert.deepEqual(combatStats, rest);
    });

    it("should take weapons into account", () => {
        const otherEntity = TEST_GAME_WORLD.createHero({
            name: "Ryoma: Peerless Samurai",
            rarity: 5,
            weapon: "Raijinto",
            skills: {
                assist: "",
                special: "",
                A: "",
                B: "",
                C: "",
                S: ""
            }
        }, TEST_GAME_WORLD.state.teamIds[0], 1);

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(otherEntity);

        assert.strictEqual(combatStats.atk, stats.atk + 16);

        TEST_GAME_WORLD.removeEntity(otherEntity);
        otherEntity.destroy();
    });

    it("should apply combat buffs", () => {
        const addedBuff = entity.addComponent({
            type: "CombatBuff",
            atk: 6
        }) as Component;

        const otherBuff = entity.addComponent({
            type: "CombatBuff",
            def: 6
        }) as Component;

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);
        const combatStats = getCombatStats(entity);
        assert.strictEqual(combatStats.atk, stats.atk + 6);
        assert.strictEqual(combatStats.def, stats.def + 6);

        entity.removeComponent(otherBuff);
        entity.removeComponent(addedBuff);
    });

    it("should only apply highest map buffs", () => {
        const firstBuff = entity.addComponent({
            type: "MapBuff",
            atk: 5
        }) as Component;

        const secondBuff = entity.addComponent({
            type: "MapBuff",
            atk: 3
        }) as Component;

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(entity);

        assert.strictEqual(combatStats.atk, stats.atk + 5);

        entity.removeComponent(firstBuff);
        entity.removeComponent(secondBuff);
    });

    it("should only apply lowest map debuffs", () => {
        const firstDebuff = entity.addComponent({
            type: "MapDebuff",
            atk: -5
        }) as Component;

        const secondDebuff = entity.addComponent({
            type: "MapDebuff",
            atk: -3
        }) as Component;

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(entity);

        assert.strictEqual(combatStats.atk, stats.atk - 5);

        entity.removeComponent(firstDebuff);
        entity.removeComponent(secondDebuff);
    });
})