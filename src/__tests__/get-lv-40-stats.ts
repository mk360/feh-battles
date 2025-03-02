import getLv40Stats, { getSingleStatValue } from "../systems/unit-stats";
import { describe, it } from "node:test";
import assert from "node:assert";
import characterData from "../data/characters.json";
import correctLevel40Stats from "./constants/lv40_stats.json";
import { Stat } from "../interfaces/types";

const STATS_ARRAY: Stat[] = ["hp", "atk", "spd", "def", "res"];

describe("getLv40Stats", () => {
    it("should accurately calculate vanilla level 40 stats", () => {
        for (let character in characterData) {
            const lv1Stats = characterData[character].stats;
            const growthRates = characterData[character].growthRates;
            const lv40 = getLv40Stats(lv1Stats, growthRates, 5);
            assert.deepEqual(lv40, {
                hp: correctLevel40Stats[character].hp.standard,
                atk: correctLevel40Stats[character].atk.standard,
                spd: correctLevel40Stats[character].spd.standard,
                def: correctLevel40Stats[character].def.standard,
                res: correctLevel40Stats[character].res.standard
            });
        }
    });

    it("should apply boons and banes", () => {
        for (let character in characterData) {
            const lv1Stats = characterData[character].stats;
            const growthRates = characterData[character].growthRates;
            for (let stat of STATS_ARRAY) {
                // boons
                const lv40Boon = getSingleStatValue(lv1Stats[stat] + 1, growthRates[stat] + 5, 5);
                assert.equal(lv40Boon, correctLevel40Stats[character][stat].boon);

                // bane
                const lv40Bane = getSingleStatValue(lv1Stats[stat] - 1, growthRates[stat] - 5, 5);
                assert.equal(lv40Bane, correctLevel40Stats[character][stat].bane);
            }
        }
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