import getLv40Stats from "../systems/unit-stats";
import { MandatoryStats } from "../interfaces/types";

describe("getLv40Stats", () => {
    it("should accurately calculate vanilla level 40 stats", () => {
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

        expect<MandatoryStats>(lv40).toEqual<MandatoryStats>({
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

        expect<MandatoryStats>(lv40).toEqual<MandatoryStats>({
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

        expect<MandatoryStats>(lvWithSupertraits).toEqual<MandatoryStats>({
            hp: 41,
            atk: 44,
            spd: 36,
            def: 40,
            res: 15
        });

        const lv40 = getLv40Stats(lv1Stats, growthRates, 5);

        expect(lv40.res - lvWithSupertraits.res).toEqual(4);
        expect(lvWithSupertraits.atk - lv40.atk).toEqual(4);
    });
});