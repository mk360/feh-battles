import { Entity } from "ape-ecs";

function getTargetedDefenseStat(unit: Entity) {
    const useMagic = unit.getOne("Weapon").useMagic;
    if (useMagic) return "res";
    return "def";
};

export default getTargetedDefenseStat;
