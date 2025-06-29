import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import checkBattleEffectiveness from "../../systems/effectiveness";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("Weapons in Z", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Zanbato", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gray: Wry Comrade",
            weapon: "Zanbato",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            weapon: "Gradivus",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });

    it("Zanbato+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Gray: Wry Comrade",
            weapon: "Zanbato+",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            weapon: "Gradivus",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        assert(checkBattleEffectiveness(unit, enemy));
    });
});