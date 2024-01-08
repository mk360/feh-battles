import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";

function getTargetedDefenseStat(attacker: Entity, defender: Entity, defenderStats: Stats) {
    if (attacker.getOne("TargetLowestDefense") && !defender.getOne("PreventTargetLowestDefense")) {
        return defenderStats.def < defenderStats.res ? "def" : "res";
    }

    const useMagic = attacker.getOne("Weapon").useMagic;
    if (useMagic) return "res";
    return "def";
};

export default getTargetedDefenseStat;
