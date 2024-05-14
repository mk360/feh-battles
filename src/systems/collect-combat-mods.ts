import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";

function collectCombatMods(unit: Entity) {
    const combatBuffs = unit.getComponents("CombatBuff");
    const combatDebuffs = unit.getComponents("CombatDebuff");

    const stats: Stats = {
        atk: 0,
        spd: 0,
        def: 0,
        res: 0
    };

    combatBuffs.forEach((buff) => {
        for (let stat in stats) {
            stats[stat] += buff[stat];
        }
    });

    combatDebuffs.forEach((debuff) => {
        for (let stat in stats) {
            stats[stat] += debuff[stat];
        }
    });

    return stats;
};

export default collectCombatMods;
