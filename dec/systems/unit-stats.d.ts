import { Entity, System } from "ape-ecs";
import { MandatoryStats } from "../types";
declare class UnitStatsSystem extends System {
    static getLv40Stats(lv1Stats: MandatoryStats): {
        hp: number;
        atk: number;
        spd: number;
        def: number;
        res: number;
    };
    static getMapStats(hero: Entity): {};
    static getBattleStats(hero: Entity): {};
}
export default UnitStatsSystem;
//# sourceMappingURL=unit-stats.d.ts.map