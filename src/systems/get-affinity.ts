import { Entity } from "ape-ecs";

function getAffinity(unit1: Entity, unit2: Entity) {
    const affinityValues: number[] = [];
    if (unit1.getOne("GuaranteedAffinity")) affinityValues.push(20);

    return Math.max.apply(null, affinityValues);
};

export default getAffinity;
