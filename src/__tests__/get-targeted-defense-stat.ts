import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";
import TEST_GAME_WORLD from "./constants/world";

describe("get-targeted-defense-stat", () => {
    const magicUser = TEST_GAME_WORLD.createHero({
        name: "Morgan: Devoted Darkness",
        rarity: 5,
        skills: {
            assist: null,
            S: null,
            special: null,
            B: null,
            C: null,
            A: null
        },
        weapon: null,
        initialPosition: {
            x: 5,
            y: 6
        }
    }, "team1");

    const physicalWeaponUser = TEST_GAME_WORLD.createHero({
        name: "Klein: Silver Nobleman",
        rarity: 5,
        skills: {
            assist: null,
            S: null,
            special: null,
            B: null,
            C: null,
            A: null
        },
        weapon: null,
        initialPosition: {
            x: 5,
            y: 4
        }
    }, "team1");

    it("should target Defense when using a physical weapon", () => {
        expect(getTargetedDefenseStat(physicalWeaponUser)).toEqual("def");
    });

    it("should target Resistance when using a magic weapon", () => {
        expect(getTargetedDefenseStat(magicUser)).toEqual("res");
    });
});