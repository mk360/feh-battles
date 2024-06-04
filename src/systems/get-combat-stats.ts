import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";
import collectCombatMods from "./collect-combat-mods";

function getCombatStats(entity: Entity) {
    const mapBuffs = entity.getComponents("MapBuff");
    const mapDebuffs = entity.getComponents("MapDebuff");
    const baseStats = entity.getOne("Stats");

    const compoundStats: Stats = {
        atk: baseStats.atk,
        spd: baseStats.spd,
        def: baseStats.def,
        res: baseStats.res
    };

    const hasPanic = entity.tags.has("Panic");

    const maxBuffs = {
        atk: 0,
        def: 0,
        spd: 0,
        res: 0
    };

    const maxDebuffs = {
        atk: 0,
        def: 0,
        res: 0,
        spd: 0
    }

    mapBuffs.forEach((buff) => {
        for (let stat in compoundStats) {
            maxBuffs[stat] = Math.max(maxBuffs[stat], buff[stat]);
        }
    });

    mapDebuffs.forEach((debuff) => {
        for (let stat in compoundStats) {
            maxDebuffs[stat] = Math.min(maxDebuffs[stat], debuff[stat]);
        }
    });

    for (let stat in maxBuffs) {
        compoundStats[stat] += hasPanic ? -maxBuffs[stat] : maxBuffs[stat];
    }

    for (let stat in maxDebuffs) {
        compoundStats[stat] += maxDebuffs[stat];
    }

    const combatMods = collectCombatMods(entity);

    for (let stat in combatMods) {
        compoundStats[stat] += combatMods[stat];
    }

    return compoundStats;
};

export default getCombatStats;
