import { Entity } from "ape-ecs";
import collectMapMods from "./collect-map-mods";
import { Stats } from "../interfaces/types";

function getMapStats(unit: Entity) {
    const collectedMods = collectMapMods(unit);
    const stats = unit.getOne("Stats");
    const statsCopy: Stats = {
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        res: stats.res,
    };

    for (let stat in collectedMods.changes) {
        statsCopy[stat] += collectedMods.changes[stat];
    }

    return statsCopy;
};

export default getMapStats;
