import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";

function collectMapMods(unit: Entity) {
    const mapBuffComponents = unit.getComponents("MapBuff");
    const mapDebuffComponents = unit.getComponents("MapDebuff");

    const hasPanic = unit.has("Panic");

    const mapBuffs: Stats = {
        atk: 0,
        spd: 0,
        def: 0,
        res: 0
    };

    const mapDebuffs: Stats = {
        atk: 0,
        spd: 0,
        def: 0,
        res: 0
    };

    const finalMapChanges: Stats = {
        atk: 0,
        spd: 0,
        def: 0,
        res: 0
    };

    mapBuffComponents.forEach((buff) => {
        for (let stat in mapBuffs) {
            mapBuffs[stat] = Math.max(mapBuffs[stat], buff[stat]);
        }
    });

    mapDebuffComponents.forEach((debuff) => {
        for (let stat in mapDebuffs) {
            mapDebuffs[stat] = Math.min(mapDebuffs[stat], debuff[stat]);
        }
    });

    const mapBuffMultiplier = hasPanic ? -1 : 1;

    for (let stat in finalMapChanges) {
        finalMapChanges[stat] = mapBuffMultiplier * mapBuffs[stat] + mapDebuffs[stat];
    }

    return {
        buffs: mapBuffs,
        debuffs: mapDebuffs,
        changes: finalMapChanges
    };
};

export default collectMapMods;
