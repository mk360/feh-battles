import { Entity } from "ape-ecs";

function getDefenseStat(unit: Entity) {
    const useMagic = unit.getOne("Weapon").useMagic;
    if (useMagic) return "def";
    return "res";
};

export default getDefenseStat;
