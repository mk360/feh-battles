import { Entity, System } from "ape-ecs";
import { MandatoryStats } from "../types";

class UnitStatsSystem extends System {
    static getLv40Stats(lv1Stats: MandatoryStats) {
        const copy = { ...lv1Stats };

        for (let stat in copy) {
            copy[stat] = 0;
        }

        return copy;
    }

    static getMapStats(hero: Entity) {
        const mapBuffs = hero.getOne("MapBuff");
        const hasPanic = !!hero.getOne("Panic");
        const baseLv40Stats = hero.getOne("Stats");

        return {};
    }

    static getBattleStats(hero: Entity) {
        const mapStats = UnitStatsSystem.getMapStats(hero);
        const combatBuffs = hero.getComponents("CombatBuff");

        return {};
    }
};

export default UnitStatsSystem;
