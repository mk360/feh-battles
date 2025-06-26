import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import SPECIALS from "../../data/specials";
import getCombatStats from "../../systems/get-combat-stats";
import TEAM_IDS from "../constants/teamIds";
import TEST_GAME_WORLD from "../constants/world";
import blankKit from "../utils/blank-kit";
import killUnits from "../utils/kill-units";

describe("U", () => {
    afterEach(() => {
        killUnits(Array.from(TEST_GAME_WORLD.getEntities("Side")));
    });

    it("Urðr", () => {
        const refresher = TEST_GAME_WORLD.createHero({
            name: "Azura: Lady of Ballads",
            weapon: "Urðr",
            skills: {
                ...blankKit(),
                assist: "Dance"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        const refreshed = TEST_GAME_WORLD.createHero({
            name: "Robin: High Deliverer",
            weapon: `Tactical Bolt`,
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[0], 2);

        refresher.addComponent({
            type: "Movable"
        });

        TEST_GAME_WORLD.runSystems("movement");

        TEST_GAME_WORLD.runAssist(refresher.id, refreshed.getOne("Position") as unknown as { x: number; y: number }, refresher.getOne("Position") as unknown as { x: number; y: number }, []);
        assert(refreshed.getOne("MapBuff"));
        assert(!refreshed.getOne("FinishedAction"));
    });

    it("Urvan", () => {
        const unit = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: {
                ...blankKit(),
                special: "Aether"
            },
            rarity: 5,
        }, TEAM_IDS[0], 1);

        assert.equal(unit.getOne("Special").maxCooldown, SPECIALS["Aether"].cooldown - 1);

        const enemy = TEST_GAME_WORLD.createHero({
            name: "Ike: Brave Mercenary",
            weapon: "Urvan",
            skills: blankKit(),
            rarity: 5
        }, TEAM_IDS[1], 1);

        unit.addComponent({
            type: "Battling"
        });
        enemy.addComponent({
            type: "Battling"
        });
        unit.addComponent({
            type: "InitiateCombat"
        });

        unit.addComponent({
            type: "GuaranteedFollowup"
        });

        unit.addComponent({
            type: "PreventCounterattack"
        });

        TEST_GAME_WORLD.runSystems("before-combat");
        TEST_GAME_WORLD.runSystems("combat");
        const { atk } = getCombatStats(unit);
        const { def } = getCombatStats(enemy);
        const [dmg1, dmg2] = unit.getComponents("DealDamage");
        assert.equal(dmg1.attacker.damage, atk - def);
        assert.equal(dmg2.attacker.damage, Math.ceil((atk - def) * 0.2));
    });
});