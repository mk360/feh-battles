import { Entity } from "ape-ecs";

function getSpecialDecrease(unit: Entity) {
    let specialDecrease = 1;
    if (unit.getOne("AccelerateSpecial")) {
        specialDecrease++;
    }

    if (unit.tags.has("Guard") || unit.getOne("Guard")) {
        specialDecrease--;
    }

    return specialDecrease;
};

export default getSpecialDecrease;
