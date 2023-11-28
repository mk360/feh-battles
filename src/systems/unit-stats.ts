import { Entity, System } from "ape-ecs";
import { MandatoryStats } from "../types";
import GameState from "./state";

class UnitStatsSystem extends System {
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
    }

    static getLv40Stats(lv1Stats: MandatoryStats, growthRates: MandatoryStats, rarity: number) {
        const copy = { ...lv1Stats };
        for (let stat in copy) {
            const growthRate = growthRates[stat];
            const masterGrowthRate = Math.floor(growthRate * (0.79 + 0.07 * rarity));
            const growthValue = Math.floor(39 * masterGrowthRate / 100);
            copy[stat] += growthValue;
        }

        return copy;
    }

    getMapStats(hero: Entity) {
        const mapBuffs = hero.getOne("MapBuff");
        const hasPanic = !!hero.getOne("Panic");
        const baseLv40Stats = hero.getOne("Stats");

        return {};
    }

    getBattleStats(hero: Entity) {
        const mapStats = this.getMapStats(hero);
        const combatBuffs = hero.getComponents("CombatBuff");

        return {};
    }
};

export default UnitStatsSystem;
