import { Component, Entity, Query, System } from "ape-ecs";

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

    checkBattleEffectiveness(hero1: Entity, hero2: Entity) {
        const skills = hero1.getComponents("SkillSlots");
        const enemySkills = hero2.getComponents("SkillSlots");
        const effectivenessAgainstEnemy = new Set<Component>();
        const opponentMovementType = hero2.getOne("MovementType");
        const opponentWeaponType = hero2.getOne("WeaponType");
        let enemyImmunities = new Set<Component>();
        for (let skill of enemySkills) {
            const immunity = (skill.properties.skill as Entity).getComponents("Immunity");
            enemyImmunities = new Set([...enemyImmunities, ...immunity]);
        }

        for (let skill of skills) {
            const effectiveness = (skill.properties.skill as Entity).getComponents("Effectiveness");
            for (let eff of effectiveness) {
                if (eff === opponentMovementType || eff === opponentWeaponType && !enemyImmunities.has(eff)) {
                    effectivenessAgainstEnemy.add(eff);
                }
            }
        }

        return !!effectivenessAgainstEnemy.size;
    }
};

export default EffectivenessSystem;
