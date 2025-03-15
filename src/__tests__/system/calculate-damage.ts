import { calculateDamageBeforeReductions } from "../../systems/calculate-damage";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("calculateDamage", () => {
    it("should simply subtract def from atk if no special factor is in play", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 51,
            effectiveness: 1,
            advantage: 0,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
            affinity: 0,
            defenseStat: 19,
            defensiveTerrain: false
        });

        assert.strictEqual(damage, 51 - 19);
    });

    it("should add 20% of atk if there's a color advantage", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 83,
            effectiveness: 1,
            advantage: 0.2,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
            affinity: 0,
            defenseStat: 17,
            defensiveTerrain: false
        });

        assert.strictEqual(damage, 82);
    });

    it("should subtract 20% of atk if there's a color disadvantage", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 40,
            effectiveness: 1,
            advantage: -0.2,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
            affinity: 0,
            defenseStat: 9,
            defensiveTerrain: false
        });

        assert.strictEqual(damage, 23);
    });

    it("should add 50% of atk if there's effectiveness", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 46,
            defenseStat: 5,
            effectiveness: 1.5,
            advantage: 0,
            defensiveTerrain: false,
            affinity: 0,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
        });

        assert.strictEqual(damage, 64);
    });

    it("should stack effectiveness with color advantage", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 70,
            defenseStat: 4,
            effectiveness: 1.5,
            advantage: 0.2,
            defensiveTerrain: false,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
            affinity: 0,
        });

        assert.strictEqual(damage, 122);
    });

    it("should stack color advantage with affinity", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 38,
            advantage: 0.2,
            affinity: 0.2,
            defenseStat: 25,
            effectiveness: 1,
            defensiveTerrain: false,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
        });

        assert.strictEqual(damage, 28);
    });

    it("should take defensive tile reduction into account", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 69,
            advantage: 0,
            affinity: 0,
            defenseStat: 22,
            effectiveness: 1,
            defensiveTerrain: true,
            specialIncreasePercentage: 0,
            flatIncrease: 0,
            staffPenalty: false,
        });

        assert.strictEqual(damage, 41);
    });

    it("should take flat damage increases into account", () => {
        const damage = calculateDamageBeforeReductions({
            atkStat: 47,
            advantage: 0,
            affinity: 0,
            defenseStat: 40,
            effectiveness: 1,
            defensiveTerrain: false,
            specialIncreasePercentage: 0,
            flatIncrease: 10,
            staffPenalty: false,
        });

        assert.strictEqual(damage, 17);
    });
});