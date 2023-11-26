import { Entity, System } from "ape-ecs";
declare class EffectivenessSystem extends System {
    private effectivenessQuery;
    private immunityQuery;
    private movementTypeQuery;
    private weaponTypeQuery;
    init(): void;
    checkBattleEffectiveness(hero1: Entity, hero2: Entity): boolean;
}
export default EffectivenessSystem;
//# sourceMappingURL=effectiveness.d.ts.map