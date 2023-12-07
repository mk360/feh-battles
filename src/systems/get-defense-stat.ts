import { Entity } from "ape-ecs";

function getDefenseStat(unit1: Entity) {
    const useMagic = unit1.getOne("Weapon").useMagic;
    if (useMagic) return "def";
    return "res";
};

export default getDefenseStat;
