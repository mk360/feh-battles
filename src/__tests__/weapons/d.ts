import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import collectMapMods from "../../systems/collect-map-mods";
import generateTurns from "../../systems/generate-turns";
import getAttackerAdvantage from "../../systems/get-attacker-advantage";
import getCombatStats from "../../systems/get-combat-stats";
import level40Stats from "../constants/lv40_stats.json";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world"
import killUnits from "../utils/kill-units";

describe("D", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Dark Breath", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 2);

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 4);

        unit.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const mapMods = collectMapMods(enemy2);
        assert.equal(mapMods.debuffs.atk, -5);
        assert.equal(mapMods.debuffs.spd, -5);
        assert(!enemy3.getOne("MapDebuff"));
    });

    it("Dark Breath+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath+",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 2);

        const enemy3 = TEST_GAME_WORLD.createHero({
            name: "Corrin: Fateful Princess",
            weapon: "Dark Breath",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 4);

        unit.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        TEST_GAME_WORLD.runSystems("after-combat");

        const mapMods = collectMapMods(enemy2);
        assert.equal(mapMods.debuffs.atk, -5);
        assert.equal(mapMods.debuffs.spd, -5);
        assert(!enemy3.getOne("MapDebuff"));
    });

    it("Dark Excalibur", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Sonya: Vengeful Mage",
            weapon: "Dark Excalibur",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "Night Sky",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[0], 1);

        unit.getOne("Special").cooldown = 0;

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Sonya: Vengeful Mage",
            weapon: "Dark Excalibur",
            skills: {
                A: "",
                B: "",
                C: "",
                S: "",
                special: "",
                assist: "",
            },
            rarity: 5
        }, TEAM_IDS[1], 1);

        enemy.getOne("Stats").res = unit.getOne("Stats").atk - 10;

        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "Battling"
        });

        enemy.addComponent({
            type: "Battling"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const dealtDamage = Array.from(unit.getComponents("DealDamage")).map((i) => i.getObject(false));
        const specialTriggered = dealtDamage.find((i) => i.attacker.triggerSpecial);
        TEST_GAME_WORLD.runSystems("after-combat");
        assert.equal(specialTriggered.attacker.damage, 10 + 10 + 5);
    });
});