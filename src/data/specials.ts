import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../interfaces/types";
import Characters from "./characters.json";
import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];

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
    "Black Luna": {
        description: "Treats foe's Def/Res as if reduced by 80% during combat. (Skill cannot be inherited.)",
        exclusiveTo: ["Black Knight: Sinister General"],
        allowedWeaponTypes: exceptStaves,
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
        allowedWeaponTypes: exceptStaves
    },
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
        allowedWeaponTypes: exceptStaves
    },
    "Aether": {
        description: "Treats foe's Def/Res as if reduced by 50% during combat. Restores HP = half of damage dealt.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 5,
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defenseStat = getTargetedDefenseStat(this.entity, target, combatStats);
            const stat = combatStats[defenseStat];
            this.entity.addComponent({
                type: "DamageIncrease",
                value: Math.floor(stat * 0.5)
            });

            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        },
    }
};

export default SPECIALS;
