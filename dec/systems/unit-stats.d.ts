import { Entity, System } from "ape-ecs";
import { MandatoryStats } from "../types";
import GameState from "./state";
declare class UnitStatsSystem extends System {
    private state;
    init(state: GameState): void;
    static getLv40Stats(lv1Stats: MandatoryStats, growthRates: MandatoryStats, rarity: number): {
        hp: number;
        atk: number;
        spd: number;
        def: number;
        res: number;
    };
    getMapStats(hero: Entity): {};
    getBattleStats(hero: Entity): {};
}
export default UnitStatsSystem;
//# sourceMappingURL=unit-stats.d.ts.map