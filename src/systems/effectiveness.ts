import { Entity } from "ape-ecs";
import Weapon from "../components/weapon";

function checkBattleEffectiveness(hero1: Entity, hero2: Entity) {
    const heroEffectiveness = hero1.getComponents("Effectiveness");
    const opponentMovementType = hero2.getOne("MovementType");
    const opponentWeaponType = hero2.getOne("Weapon");
    const immunities = Array.from(hero2.getComponents("Immunity")).map((comp) => comp.value);

    for (let effectiveness of heroEffectiveness) {
        if (immunities.includes(effectiveness.value)) continue;
        if ([opponentMovementType.value, opponentWeaponType.weaponType].includes(effectiveness.value)) {
            return true;
        }
    }

    return false;
}

export default checkBattleEffectiveness;
