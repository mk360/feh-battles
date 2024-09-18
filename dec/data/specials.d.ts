import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../interfaces/types";
import Characters from "./characters.json";
import GameState from "../systems/state";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        onCombatRoundAttack?(this: Skill, target: Entity): void;
        type?: "aoe";
        getAoETargets?(this: Skill, state: GameState, target: Entity): Set<Entity>;
        getAoEDamage?(this: Skill, state: GameState, target: Entity): number;
        onAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        onSpecialTrigger?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatStart?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatAfter?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatRoundAttack?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onEquip?(this: Skill): any;
        onTurnCheckRange?(this: Skill, state: GameState): void;
        onTurnStart?(this: Skill, battleState: GameState): void;
        onTurnStartBefore?(this: Skill, battleState: GameState): void;
        onTurnStartAfter?(this: Skill, battleState: GameState): void;
        onAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        onAllyAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        shouldActivate?(this: Skill, damage: number): boolean;
    };
}
declare const SPECIALS: SpecialsDict;
export default SPECIALS;
//# sourceMappingURL=specials.d.ts.map