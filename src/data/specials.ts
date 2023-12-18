import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../weapon";
import Characters from "./characters.json";
import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";

interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes?: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        onCombatRoundAttack?(this: Skill, target: Entity): void;
        onCombatRoundDefense?(this: Skill, target: Entity): void;
    }
}

const SPECIALS: SpecialsDict = {
    "Iceberg": {
        description: "Boosts damage by 50% of unit's Res.",
        cooldown: 3,
        onCombatRoundAttack() {
            const { res } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "DamageIncrease",
                value: Math.floor(res / 2)
            });
        },
        allowedWeaponTypes: ["axe", "beast", "bow", "breath", "tome", "sword", "lance", "dagger"]
    },
    "Dragon Fang": {
        description: "Boosts damage by 50% of unit's Atk.",
        cooldown: 4,
        onCombatRoundAttack() {
            const { atk } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "DamageIncrease",
                value: Math.floor(atk / 2)
            });
        },
        allowedWeaponTypes: ["axe", "beast", "bow", "breath", "tome", "sword", "lance", "dagger"]
    },
    "Black Luna": {
        description: "Treats foe's Def/Res as if reduced by 80% during combat. (Skill cannot be inherited.)",
        exclusiveTo: ["Black Knight: Sinister General"],
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defStat = getTargetedDefenseStat(this.entity, target, combatStats);
            this.entity.addComponent({
                type: "DamageIncrease",
                value: Math.floor(combatStats[defStat] * 0.8)
            });
        },
        cooldown: 3
    },
};

export default SPECIALS;
