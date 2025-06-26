import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import checkBattleEffectiveness from "../../systems/effectiveness";
import getAffinity from "../../systems/get-affinity";
import getCombatStats from "../../systems/get-combat-stats";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("W", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Weirding Tome", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Lute: Prodigy",
            weapon: "Weirding Tome",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        const enemy2 = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 2);

        enemy.getOne("Position").y = unit.getOne("Position").y;
        enemy2.getOne("Position").x = unit.getOne("Position").x;
        enemy2.getOne("Stats").res = unit.getOne("Stats").res + 1;

        TEST_GAME_WORLD.runSystems("every-turn");

        assert(!enemy2.getOne("MapDebuff"));
        const enemyDebuff = enemy.getOne("MapDebuff");
        assert.equal(enemyDebuff.spd, -5);
    });

    it("Whitewing Blade", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Palla: Eldest Whitewing",
            weapon: "Whitewing Blade",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        TEST_GAME_WORLD.runSystems("before-combat");
        assert.equal(getAffinity(unit, enemy), 0.2);
    });

    it("Whitewing Lance", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Catria: Middle Whitewing",
            weapon: "Whitewing Lance",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS["Aether"].cooldown - 1);
    });

    it("Whitewing Spear", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Est: Junior Whitewing",
            weapon: "Whitewing Spear",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const unit2 = TEST_GAME_WORLD.createHero({
            name: "Black Knight: Sinister General",
            weapon: "Alondite",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const unit3 = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            weapon: "Gradivus",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        assert(checkBattleEffectiveness(unit, unit2));
        assert(checkBattleEffectiveness(unit, unit3));
    });

    it("Wind's Brand", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Soren: Shrewd Strategist",
            weapon: "Wind's Brand",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const unit2 = TEST_GAME_WORLD.createHero({
            name: "Soren: Shrewd Strategist",
            weapon: "Wind's Brand",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit2.getOne("Stats").atk = unit2.getOne("Stats").atk - 1;

        const unit3 = TEST_GAME_WORLD.createHero({
            name: "Soren: Shrewd Strategist",
            weapon: "Wind's Brand",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        TEST_GAME_WORLD.runSystems("every-turn");

        const debuff = unit3.getOne("MapDebuff");
        assert.equal(debuff.atk, -7);
    });

    it("Wing Sword", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Caeda: Talys's Heart",
            weapon: "Wing Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const unit2 = TEST_GAME_WORLD.createHero({
            name: "Black Knight: Sinister General",
            weapon: "Alondite",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        const unit3 = TEST_GAME_WORLD.createHero({
            name: "Camus: Sable Knight",
            weapon: "Gradivus",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 2);

        assert(checkBattleEffectiveness(unit, unit2));
        assert(checkBattleEffectiveness(unit, unit3));
    });

    it("Wo Dao", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Caeda: Talys's Heart",
            weapon: "Wo Dao",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Caeda: Talys's Heart",
            weapon: "Wing Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit.getOne("Special").cooldown = 0;
        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        const { atk } = getCombatStats(unit);
        const { def } = getCombatStats(enemy);

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const damage = unit.getOne("DealDamage");
        assert.equal(damage.attacker.damage, atk - def + Math.floor(def / 2) + 10);
    });

    it("Wo Dao+", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Caeda: Talys's Heart",
            weapon: "Wo Dao+",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Caeda: Talys's Heart",
            weapon: "Wing Sword",
            skills: blankKit(),
            rarity: 5,
        }, TEAM_IDS[1], 1);

        unit.getOne("Special").cooldown = 0;
        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });

        unit.addComponent({
            type: "InitiateCombat"
        });

        const { atk } = getCombatStats(unit);
        const { def } = getCombatStats(enemy);

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");

        const damage = unit.getOne("DealDamage");
        assert.equal(damage.attacker.damage, atk - def + Math.floor(def / 2) + 10);
    });
});