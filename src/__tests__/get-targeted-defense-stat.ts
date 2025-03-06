import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";
import TEST_GAME_WORLD from "./constants/world";
import { after, describe, it } from "node:test";
import assert from "node:assert";
import killUnits from "./utils/kill-units";

describe("get-targeted-defense-stat", () => {
    const magicUser = TEST_GAME_WORLD.createHero({
        name: "Arvis: Emperor of Flame",
        rarity: 5,
        skills: {
            assist: "",
            S: "",
            special: "",
            B: "",
            C: "",
            A: ""
        },
        weapon: "",
    }, TEST_GAME_WORLD.state.teamIds[0], 2);

    const physicalWeaponUser = TEST_GAME_WORLD.createHero({
        name: "Hector: General of Ostia",
        rarity: 5,
        skills: {
            assist: "",
            S: "",
            special: "",
            B: "",
            C: "",
            A: ""
        },
        weapon: "",
    }, TEST_GAME_WORLD.state.teamIds[1], 1);

    after(() => killUnits([physicalWeaponUser, magicUser]));

    it("should target Defense when using a physical weapon", () => {
        assert.strictEqual(getTargetedDefenseStat(physicalWeaponUser, magicUser, getCombatStats(magicUser)), "def");
    });

    it("should target Resistance when using a magic weapon", () => {
        assert.strictEqual(getTargetedDefenseStat(magicUser, physicalWeaponUser, getCombatStats(physicalWeaponUser)), "res");
    });

    it("should target the lowest of two defenses if defender has appropriate component", () => {
        physicalWeaponUser.addComponent({
            type: "TargetLowestDefense"
        });

        assert.strictEqual(getTargetedDefenseStat(physicalWeaponUser, physicalWeaponUser, getCombatStats(physicalWeaponUser)), "res");
    });
});