import GameState from "../systems/state";
import { MovementType, WeaponColor, WeaponType } from "../interfaces/types";
import Skill from "../components/skill";
import Characters from "./characters.json";
import { Entity } from "ape-ecs";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        displayName?: string;
        type: WeaponType;
        color?: WeaponColor;
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        protects?: (MovementType | WeaponType)[];
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
    };
}
declare const WEAPONS: WeaponDict;
export default WEAPONS;
//# sourceMappingURL=weapons.d.ts.map