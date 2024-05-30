import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";
declare function getTargetedDefenseStat(attacker: Entity, defender: Entity, defenderStats: Stats): "def" | "res";
export default getTargetedDefenseStat;
//# sourceMappingURL=get-targeted-defense-stat.d.ts.map