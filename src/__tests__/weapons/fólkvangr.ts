import { describe, it } from "node:test";
import assert from "node:assert";
import collectMapMods from "../../systems/collect-map-mods";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";

describe("Fólkvangr", () => {
    it("should run the turn start effect", () => {
        const sword = TEST_GAME_WORLD.createHero({
            name: "Alfonse: Prince of Askr",
            skills: {
                A: "",
                assist: "",
                B: "",
                C: "",
                S: "",
                special: "",
            },
            rarity: 5,
            weapon: "Fólkvangr",
        }, TEAM_IDS[0], 1);
        sword.getOne("Stats").hp = 1;
        TEST_GAME_WORLD.runSystems("every-turn");
        const mapBuffs = collectMapMods(sword);
        assert.equal(mapBuffs.buffs.atk, 5);

        sword.addComponent({
            type: "Kill"
        });
        TEST_GAME_WORLD.runSystems("kill");
    });
});