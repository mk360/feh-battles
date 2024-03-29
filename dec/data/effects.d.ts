import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
export declare function honeStat(thisArg: Skill, state: GameState, stat: Stat, buff: number): void;
export declare function mapBuffByMovementType(thisArg: Skill, state: GameState, movementType: MovementType, buffs: Stats): void;
export declare function mapBuffByRange(thisArg: Skill, state: GameState, range: number, buffs: Stats): void;
export declare function dodgeStat(thisArg: Skill, enemy: Entity, comparedStat: Stat): void;
export declare function combatBuffByRange(thisArg: Skill, ally: Entity, range: number, buffs: Stats): void;
export declare function combatBuffByMovementType(thisArg: Skill, ally: Entity, movementType: MovementType, buffs: Stats): void;
export declare function defiant(thisArg: Skill, stat: Stat, buff: number): void;
export declare function breaker(thisArg: Skill, enemy: Entity, targetWeaponType: WeaponType, hpPercentage: number): void;
export declare function raven(thisArg: Skill, enemy: Entity): void;
export declare function bond(thisArg: Skill, state: GameState, buffs: Stats): void;
export declare function elementalBoost(thisArg: Skill, target: Entity, buffs: Stats): void;
export declare function renewal(thisArg: Skill, shouldActivate: boolean, amount: number): void;
export declare function threaten(thisArg: Skill, state: GameState, statDebuffs: Stats): void;
export declare function dagger(state: GameState, target: Entity, debuffs: Stats): void;
export declare function counterattack(thisArg: Skill): void;
export declare function owl(thisArg: Skill, state: GameState): void;
export declare function blade(thisArg: Skill): void;
//# sourceMappingURL=effects.d.ts.map