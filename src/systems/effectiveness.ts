import { Query, System } from "ape-ecs";
import Hero from "../hero";

class EffectivenessSystem extends System {
    private effectivenessQuery: Query;
    private immunityQuery: Query;
    private movementTypeQuery: Query;
    private weaponTypeQuery: Query;

    init() {
        this.effectivenessQuery = this.createQuery().from("Effectiveness");
        this.immunityQuery = this.createQuery().from("Immunity");
        this.movementTypeQuery = this.createQuery().from("MovementType");
        this.weaponTypeQuery = this.createQuery().from("WeaponType");
    }

    checkBattleEffectiveness(hero1, hero2) {
        let effectivessSet = new Set();
        for (let skillSlot in hero1.skills) {
            const effectiveness = hero1.skills[skillSlot].getComponents("Effectiveness");
            effectivessSet = new Set([...effectivessSet, ...effectiveness]);
        }

        let defenseSet = new Set();

        for (let skillSlot in hero2.skills) {
            const immunity = hero2.skills[skillSlot].getComponents("Immunity");
            defenseSet = new Set([...defenseSet, ...immunity]);
        }
        
        for (let effective of effectivessSet) {
            if (defenseSet.has(effective)) return true;
        }

        return false;
    }
};

export default EffectivenessSystem;
