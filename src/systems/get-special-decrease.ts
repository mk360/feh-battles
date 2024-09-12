import { Entity } from "ape-ecs";

function getSpecialDecrease(unit: Entity, enemy: Entity) {
    let specialDecrease = 1;
    if (unit.getOne("AccelerateSpecial") && !enemy.getOne("NeutralizeAccelerateSpecial")) {
        specialDecrease++;
    }

    if (unit.tags.has("Guard") || unit.getOne("Guard")) {
        specialDecrease--;
    }

    return specialDecrease;
};

export default getSpecialDecrease;
