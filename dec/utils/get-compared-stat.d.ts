import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";
declare function getComparedStat(unit: Entity, stat: Exclude<keyof Stats, "hp">): void;
export default getComparedStat;
//# sourceMappingURL=get-compared-stat.d.ts.map