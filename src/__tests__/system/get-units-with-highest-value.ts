import { describe, it, after } from "node:test";
import TEST_GAME_WORLD from "../constants/world";
import TEAM_IDS from "../constants/teamIds";
import { getUnitsWithHighestValue } from "../../systems/value-matchers";
import assert from "assert";
import killUnits from "../utils/kill-units";
import blankKit from "../utils/blank-kit";

describe("Get-units-with-highest-value", () => {
    const ally = TEST_GAME_WORLD.createHero({
        name: "Chrom: Exalted Prince",
        skills: blankKit(),
        rarity: 5,
        weapon: "Falchion (Awakening)",
    }, TEAM_IDS[0], 2);

    const anna = TEST_GAME_WORLD.createHero({
        name: "Anna: Commander",
        skills: blankKit(),
        rarity: 5,
        weapon: "Nóatún",
    }, TEAM_IDS[0], 1);

    const ally2 = TEST_GAME_WORLD.createHero({
        name: "Hector: General of Ostia",
        skills: blankKit(),
        rarity: 5,
        weapon: "Silver Axe+",
    }, TEAM_IDS[0], 3);

    after(() => killUnits([anna, ally, ally2]));

    it("should find more than one unit", () => {
        anna.getOne("Stats").spd = 36;
        ally.getOne("Stats").spd = 36;

        const highestSpd = getUnitsWithHighestValue([anna, ally, ally2], (entity) => entity.getOne("Stats").spd);
        assert(!highestSpd.includes(ally2));
        assert(highestSpd.includes(ally));
        assert(highestSpd.includes(anna));
    });

    it("can find a single unit when applicable", () => {
        anna.getOne("Stats").spd = Math.floor(Math.random() * 999);
        ally.getOne("Stats").spd = Math.floor(Math.random() * 999) - anna.getOne("Stats").spd;
        ally2.getOne("Stats").spd = Math.floor(Math.random() * 999) - anna.getOne("Stats").spd;
        const highestSpd = getUnitsWithHighestValue([anna, ally, ally2], (entity) => entity.getOne("Stats").spd);
        assert.equal(highestSpd.length, 1);
    });
});