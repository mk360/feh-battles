import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Assist from "../components/assist";
import { WeaponType } from "../interfaces/types";
import MovementType from "../components/movement-type";
import Characters from "./characters.json";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
type AssistKind = "refresh" | "movement" | "buff" | "healing";
interface AssistsDict {
    [k: string]: {
        canApply(this: Assist, state: GameState, ally: Entity, position: {
            x: number;
            y: number;
        }): boolean;
        onApply(this: Assist, state: GameState, ally: Entity): void;
        onEquip?(this: Assist): void;
        description: string;
        range: number;
        allowedWeaponTypes?: WeaponType[];
        allowedMovementTypes?: MovementType[];
        exclusiveTo?: (keyof typeof Characters)[];
        type: AssistKind[];
        onSpecialTrigger?(this: Assist, battleState: GameState, target: Entity): void;
        onCombatStart?(this: Assist, battleState: GameState, target: Entity): void;
        onCombatAfter?(this: Assist, battleState: GameState, target: Entity): void;
        onCombatInitiate?(this: Assist, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Assist, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Assist, state: GameState, attacker: Entity): void;
        onCombatRoundAttack?(this: Assist, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Assist, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onEquip?(this: Assist): any;
        onTurnCheckRange?(this: Assist, state: GameState): void;
        onTurnStart?(this: Assist, battleState: GameState): void;
        onTurnStartBefore?(this: Assist, battleState: GameState): void;
        onTurnStartAfter?(this: Assist, battleState: GameState): void;
        onAssistAfter?(this: Assist, battleState: GameState, ally: Entity, assistSkill: Assist): void;
        onAllyAssistAfter?(this: Assist, battleState: GameState, ally: Entity, assistSkill: Assist): void;
    };
}
declare const ASSISTS: AssistsDict;
export default ASSISTS;
//# sourceMappingURL=assists.d.ts.map