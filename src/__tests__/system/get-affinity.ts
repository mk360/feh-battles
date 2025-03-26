import { after, describe, it } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import TEAM_IDS from "../constants/teamIds";
import killUnits from "../utils/kill-units";
import assert from "assert";
import getAffinity from "../../systems/get-affinity";
import blankKit from "../utils/blank-kit";

describe("get-affinity", () => {
    const unit1 = TEST_GAME_WORLD.createHero({
        name: "Chrom: Exalted Prince",
        weapon: "",
        skills: blankKit(),
        rarity: 5
    }, TEAM_IDS[0], 1);

    const unit2 = TEST_GAME_WORLD.createHero({
        name: "Azura: Lady of the Lake",
        weapon: "",
        skills: blankKit(),
        rarity: 5
    }, TEAM_IDS[1], 1);

    after(() => {
        killUnits([unit1, unit2]);
    });

    it("should follow color triangle when applying affinity", () => {
        unit2.addComponent({
            type: "ApplyAffinity",
            value: 20
        });

        assert.equal(getAffinity(unit1, unit2), -0.2);
        assert.equal(getAffinity(unit2, unit1), 0.2);
    });

    it("should reverse color triangle with ReverseAffinity", () => {
        unit1.addComponent({
            type: "ReverseAffinity"
        });

        assert.equal(getAffinity(unit1, unit2), 0.2);
        assert.equal(getAffinity(unit2, unit1), -0.2);
    });
});