import assert from "assert";
import { describe, it } from "node:test";
import WEAPONS from "../../data/weapons";
import lv40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import killUnits from "../utils/kill-units";

describe("Generic Weapons", () => {
    it("Physical Weapons should be equipped", () => {
        for (let quality of ["Iron", "Steel", "Silver"]) {
            const sword = TEST_GAME_WORLD.createHero({
                name: "Chrom: Exalted Prince",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `${quality} Sword`,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            const lance = TEST_GAME_WORLD.createHero({
                name: "Lukas: Sharp Soldier",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `${quality} Lance`,
                rarity: 5,
            }, TEAM_IDS[0], 2);

            const axe = TEST_GAME_WORLD.createHero({
                name: "Amelia: Rose of the War",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `${quality} Axe`,
                rarity: 5,
            }, TEAM_IDS[0], 3);

            const bow = TEST_GAME_WORLD.createHero({
                name: "Virion: Elite Archer",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: `${quality} Bow`,
                rarity: 5,
            }, TEAM_IDS[0], 4);

            const dagger = TEST_GAME_WORLD.createHero({
                name: "Saizo: Angry Ninja",
                weapon: `${quality} Dagger`,
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                rarity: 5
            }, TEAM_IDS[1], 1);

            assert.equal(lance.getOne("Stats").atk, lv40Stats["Lukas: Sharp Soldier"].atk.standard + WEAPONS[`${quality} Lance`].might);
            assert.equal(sword.getOne("Stats").atk, lv40Stats["Chrom: Exalted Prince"].atk.standard + WEAPONS[`${quality} Sword`].might);
            assert.equal(axe.getOne("Stats").atk, lv40Stats["Amelia: Rose of the War"].atk.standard + WEAPONS[`${quality} Axe`].might);
            assert.equal(bow.getOne("Stats").atk, lv40Stats["Virion: Elite Archer"].atk.standard + WEAPONS[`${quality} Bow`].might);
            assert(bow.getOne("Effectiveness"));
            assert.equal(bow.getOne("Effectiveness").value, "flier");

            assert.equal(dagger.getOne("Stats").atk, lv40Stats["Saizo: Angry Ninja"].atk.standard + WEAPONS[`${quality} Dagger`].might);

            killUnits([sword, axe, lance, bow, dagger]);
        }

        const sword = TEST_GAME_WORLD.createHero({
            name: "Chrom: Exalted Prince",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            weapon: `Silver Sword+`,
            rarity: 5,
        }, TEAM_IDS[0], 1);
        assert.equal(sword.getOne("Stats").atk, lv40Stats["Chrom: Exalted Prince"].atk.standard + WEAPONS["Silver Sword+"].might);

        const lance = TEST_GAME_WORLD.createHero({
            name: "Azura: Lady of the Lake",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            weapon: `Silver Lance+`,
            rarity: 5,
        }, TEAM_IDS[0], 2);
        assert.equal(lance.getOne("Stats").atk, lv40Stats["Azura: Lady of the Lake"].atk.standard + WEAPONS["Silver Lance+"].might);

        const axe = TEST_GAME_WORLD.createHero({
            name: "Azura: Lady of Ballads",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            weapon: `Silver Lance+`,
            rarity: 5,
        }, TEAM_IDS[0], 3);
        assert.equal(axe.getOne("Stats").atk, lv40Stats["Azura: Lady of Ballads"].atk.standard + WEAPONS["Silver Axe+"].might);

        const bow = TEST_GAME_WORLD.createHero({
            name: "Clarisse: Sniper in the Dark",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                assist: "",
                special: "",
            },
            weapon: `Silver Bow+`,
            rarity: 5,
        }, TEAM_IDS[0], 4);
        assert.equal(bow.getOne("Stats").atk, lv40Stats["Clarisse: Sniper in the Dark"].atk.standard + WEAPONS["Silver Bow+"].might);
        assert(bow.getOne("Effectiveness"));
        assert.equal(bow.getOne("Effectiveness").value, "flier");

        killUnits([sword, lance, axe, bow]);
    });

    it("Tomes should be equipped", () => {
        const greenTomes = ["Wind", "Elwind", "Rexcalibur", "Rexcalibur+"];
        const redTomes = ["Fire", "Elfire", "Bolganone", "Bolganone+", "Flux", "Ruin", "Fenrir", "Fenrir+"];
        const blueTomes = ["Thunder", "Elthunder", "Thoron"];

        for (let tome of greenTomes) {
            const tomeUnit = TEST_GAME_WORLD.createHero({
                name: "Soren: Shrewd Strategist",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: tome,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(tomeUnit.getOne("Stats").atk, lv40Stats["Soren: Shrewd Strategist"].atk.standard + WEAPONS[tome].might);

            killUnits([tomeUnit]);
        }

        for (let tome of redTomes) {
            const tomeUnit = TEST_GAME_WORLD.createHero({
                name: "Celica: Caring Princess",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: tome,
                rarity: 5,
            }, TEAM_IDS[0], 2);

            assert.equal(tomeUnit.getOne("Stats").atk, lv40Stats["Celica: Caring Princess"].atk.standard + WEAPONS[tome].might);

            killUnits([tomeUnit]);
        }

        for (let tome of blueTomes) {
            const tomeUnit = TEST_GAME_WORLD.createHero({
                name: "Ursula: Blue Crow",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: tome,
                rarity: 5,
            }, TEAM_IDS[0], 3);

            assert.equal(tomeUnit.getOne("Stats").atk, lv40Stats["Ursula: Blue Crow"].atk.standard + WEAPONS[tome].might);

            killUnits([tomeUnit]);
        }
    });

    it("Breaths should be equipped", () => {
        for (let breath of ["Fire Breath", "Fire Breath+", "Flametongue", "Flametongue+"]) {
            const breathUnit = TEST_GAME_WORLD.createHero({
                name: "Tiki: Dragon Scion",
                skills: {
                    A: "",
                    B: "",
                    C: "",
                    S: "",
                    assist: "",
                    special: "",
                },
                weapon: breath,
                rarity: 5,
            }, TEAM_IDS[0], 1);

            assert.equal(breathUnit.getOne("Stats").atk, lv40Stats["Tiki: Dragon Scion"].atk.standard + WEAPONS[breath].might);

            killUnits([breathUnit]);
        }
    });
});