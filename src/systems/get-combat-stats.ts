import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";
import collectCombatMods from "./collect-combat-mods";
import getMapStats from "./get-map-stats";

/**
 * Compute the full stats a unit will use in combat.
 */
function getCombatStats(entity: Entity) {
    const baseStats = getMapStats(entity);

    const compoundStats: Stats = {
        atk: baseStats.atk,
        spd: baseStats.spd,
        def: baseStats.def,
        res: baseStats.res
    };

    const combatMods = collectCombatMods(entity);

    for (let stat in combatMods) {
        compoundStats[stat] += combatMods[stat];
    }

    return compoundStats;
};

export default getCombatStats;
