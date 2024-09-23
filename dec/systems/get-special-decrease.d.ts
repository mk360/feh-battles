import { Entity } from "ape-ecs";
/**
 * Get special cooldown decrease. Cooldown naturally decreases by 1, but some conditions can make it drop by 2 or not dropping at all.
 */
declare function getSpecialDecrease(unit: Entity): number;
export default getSpecialDecrease;
//# sourceMappingURL=get-special-decrease.d.ts.map