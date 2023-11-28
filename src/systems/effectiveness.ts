import { Component, Entity, Query, System } from "ape-ecs";

class EffectivenessSystem extends System {
    checkBattleEffectiveness(hero1: Entity, hero2: Entity) {
        const heroEffectiveness = hero1.getComponents("Effectiveness");
        const opponentMovementType = hero2.getOne("MovementType");
        const opponentWeaponType = hero2.getOne("WeaponType");
        const immunities = hero2.getComponents("Immunity");

        for (let effectiveness of heroEffectiveness) {
            if (immunities.has(effectiveness)) break;
            if ([opponentMovementType.value, opponentWeaponType.weaponType].includes(effectiveness.value)) {
                return true;
            }
        }

        return false;
    }
};

export default EffectivenessSystem;
