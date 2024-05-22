import { Entity } from "ape-ecs";
declare function collectMapMods(unit: Entity): {
    buffs: Partial<import("../interfaces/types").MandatoryStats>;
    debuffs: Partial<import("../interfaces/types").MandatoryStats>;
    changes: Partial<import("../interfaces/types").MandatoryStats>;
};
export default collectMapMods;
//# sourceMappingURL=collect-map-mods.d.ts.map