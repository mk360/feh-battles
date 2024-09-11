import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../interfaces/types";
import Characters from "./characters.json";
import GameState from "../systems/state";
interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes?: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        onCombatRoundAttack?(this: Skill, target: Entity): void;
        onCombatRoundDefense?(this: Skill, target: Entity): void;
        type?: "aoe";
        getAoETargets?(this: Skill, state: GameState, target: Entity): Set<Entity>;
        getAoEDamage?(this: Skill, state: GameState, target: Entity): number;
    };
}
declare const SPECIALS: SpecialsDict;
export default SPECIALS;
//# sourceMappingURL=specials.d.ts.map