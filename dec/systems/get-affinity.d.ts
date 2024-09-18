import { Entity } from "ape-ecs";
import { WeaponColor } from "../interfaces/types";
declare function getAffinity(unit1: Entity, unit2: Entity): number;
export declare function getColorRelationship(color1: WeaponColor, color2: WeaponColor): "advantage" | "disadvantage" | "neutral";
export default getAffinity;
//# sourceMappingURL=get-affinity.d.ts.map