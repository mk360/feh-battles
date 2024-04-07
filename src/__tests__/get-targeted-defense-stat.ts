import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";
import TEST_GAME_WORLD from "./constants/world";

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
    }, "team1", 2);

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
    }, "team1", 1);

    it("should target Defense when using a physical weapon", () => {
        expect(getTargetedDefenseStat(physicalWeaponUser, magicUser, getCombatStats(magicUser))).toEqual("def");
    });

    it("should target Resistance when using a magic weapon", () => {
        expect(getTargetedDefenseStat(magicUser, physicalWeaponUser, getCombatStats(physicalWeaponUser))).toEqual("res");
    });

    it("should target the lowest of two defenses if defender has appropriate component", () => {
        physicalWeaponUser.addComponent({
            type: "TargetLowestDefense"
        });

        expect(getTargetedDefenseStat(physicalWeaponUser, physicalWeaponUser, getCombatStats(physicalWeaponUser))).toEqual("res");
    });
});