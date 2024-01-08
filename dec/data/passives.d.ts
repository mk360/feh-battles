import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import GameState from "../systems/state";
import { MovementType, PassiveSlot, WeaponType, WeaponColor } from "../interfaces/types";
import Characters from "./characters.json";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
interface PassivesDict {
    [k: string]: {
        description: string;
        slot: PassiveSlot;
        allowedMovementTypes?: MovementType[];
        allowedWeaponTypes?: WeaponType[];
        allowedColors?: WeaponColor[];
        protects?: (MovementType | WeaponType)[];
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        onCombatStart?(this: Skill, state: GameState, target: Entity): void;
        onEquip?(this: Skill): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatAfter?(this: Skill, state: GameState, target: Entity): void;
        onTurnStart?(this: Skill, state: GameState): void;
        onCombatRoundAttack?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onTurnCheckRange?(this: Skill, state: GameState): void;
        onTurnAllyCheckRange?(this: Skill, state: GameState, ally: Entity): void;
        onTurnEnemyCheckRange?(this: Skill, state: GameState, ally: Entity): void;
    };
}
declare const PASSIVES: PassivesDict;
export default PASSIVES;
//# sourceMappingURL=passives.d.ts.map