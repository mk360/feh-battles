import calculateDamage from "../systems/calculate-damage";

describe("calculateDamage", () => {
    it("should simply subtract def from atk if no special factor is in play", () => {
        const damage = calculateDamage({
            atkStat: 51,
            effectiveness: 1,
            advantage: 0,
            flatReduction: 0,
            damagePercentage: 1,
            affinity: 0,
            defenseStat: 19,
            defensiveTerrain: false
        });

        expect(damage).toEqual(51 - 19);
    });

    it("should add 20% of atk if there's a color advantage", () => {
        const damage = calculateDamage({
            atkStat: 83,
            effectiveness: 1,
            advantage: 0.2,
            flatReduction: 0,
            damagePercentage: 1,
            affinity: 0,
            defenseStat: 17,
            defensiveTerrain: false
        });

        expect(damage).toEqual(82);
    });

    it("should subtract 20% of atk if there's a color disadvantage", () => {
        const damage = calculateDamage({
            atkStat: 40,
            effectiveness: 1,
            advantage: -0.2,
            flatReduction: 0,
            damagePercentage: 1,
            affinity: 0,
            defenseStat: 9,
            defensiveTerrain: false
        });

        expect(damage).toEqual(23);
    });

    it("should add 50% of atk if there's effectiveness", () => {
        const damage = calculateDamage({
            atkStat: 46,
            defenseStat: 5,
            effectiveness: 1.5,
            flatReduction: 0,
            advantage: 0,
            defensiveTerrain: false,
            affinity: 0,
            damagePercentage: 1
        });

        expect(damage).toEqual(64);
    });

    it("should stack effectiveness with color advantage", () => {
        const damage = calculateDamage({
            atkStat: 44,
            defenseStat: 9,
            effectiveness: 1.5,
            advantage: 0.2,
            defensiveTerrain: false,
            damagePercentage: 1,
            affinity: 0,
            flatReduction: 0,
        });

        expect(damage).toEqual(70);
    });

    it("should stack color advantage with affinity", () => {
        const damage = calculateDamage({
            atkStat: 38,
            advantage: 0.2,
            affinity: 0.2,
            defenseStat: 25,
            effectiveness: 1,
            defensiveTerrain: false,
            flatReduction: 0,
            damagePercentage: 1
        });

        expect(damage).toEqual(28);
    });
});