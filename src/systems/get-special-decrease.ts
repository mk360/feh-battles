import { Entity } from "ape-ecs";

/**
 * Get special cooldown decrease. Cooldown naturally decreases by 1, but some conditions can make it drop by 2 or not dropping at all.
 */
function getSpecialDecrease(unit: Entity) {
    let specialDecrease = 1;
    if (unit.getOne("AccelerateSpecial")) {
        specialDecrease++;
    }

    if (unit.getOne("SlowSpecial")) {
        specialDecrease--;
    }

    return Math.max(0, specialDecrease);
};

export default getSpecialDecrease;
