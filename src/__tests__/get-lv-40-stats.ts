import getLv40Stats from "../systems/unit-stats";
import { describe, it, test } from "node:test";
import assert from "node:assert";

describe("getLv40Stats", () => {
    test("should accurately calculate vanilla level 40 stats", () => {
        const lv1Stats = {
            hp: 19,
            atk: 10,
            spd: 8,
            def: 10,
            res: 6
        };

        const growthRates = {
            hp: 50,
            atk: 70,
            spd: 65,
            def: 70,
            res: 30
        };

        const lv40 = getLv40Stats(lv1Stats, growthRates, 5);

        assert.deepEqual(lv40, {
            hp: 41,
            atk: 40,
            spd: 36,
            def: 40,
            res: 19
        });
    });

    it("should apply boons and banes", () => {
        const lv1Stats = {
            hp: 19,
            atk: 10,
            spd: 8,
            def: 10,
            res: 6
        };

        const growthRates = {
            hp: 50,
            atk: 70,
            spd: 65,
            def: 70,
            res: 30
        };

        const lv40 = getLv40Stats(lv1Stats, growthRates, 5, "hp", "res");

        assert.deepEqual(lv40, {
            hp: 44,
            atk: 40,
            spd: 36,
            def: 40,
            res: 15
        });
    });

    it("should apply superboons and superbanes", () => {
        const lv1Stats = {
            hp: 19,
            atk: 10,
            spd: 8,
            def: 10,
            res: 6
        };

        const growthRates = {
            hp: 50,
            atk: 70,
            spd: 65,
            def: 70,
            res: 30
        };

        const lvWithSupertraits = getLv40Stats(lv1Stats, growthRates, 5, "atk", "res");

        assert.deepEqual(lvWithSupertraits, {
            hp: 41,
            atk: 44,
            spd: 36,
            def: 40,
            res: 15
        });

        const lv40 = getLv40Stats(lv1Stats, growthRates, 5);

        assert.strictEqual(lv40.res - lvWithSupertraits.res, 4);
        assert.strictEqual(lvWithSupertraits.atk - lv40.atk, 4);
    });
});