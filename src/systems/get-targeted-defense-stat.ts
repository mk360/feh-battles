import { Entity } from "ape-ecs";
import { Stats } from "../types";

function getTargetedDefenseStat(attacker: Entity, defender: Entity, defenderStats: Stats) {
    if (defender.getOne("TargetLowestDefense")) {
        return defenderStats.def < defenderStats.res ? "def" : "res";
    }

    const useMagic = attacker.getOne("Weapon").useMagic;
    if (useMagic) return "res";
    return "def";
};

export default getTargetedDefenseStat;
