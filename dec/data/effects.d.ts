import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
/**
 * Specified target can move to any tile adjacent to calling ally within 2 spaces
 * for ex. if Hinoka calls this effect, allies can move to one space near Hinoka
 */
export declare function guidance(sourceEntity: Entity, state: GameState, target: Entity): void;
/**
 * Apply specified map buff to adjacent allies
 */
export declare function honeStat(skill: Skill, state: GameState, stat: Stat, buff: number): void;
export declare function mapBuffByMovementType(skill: Skill, state: GameState, movementType: MovementType, buffs: Stats): void;
export declare function mapBuffByRange(skill: Skill, state: GameState, range: number, buffs: Stats): void;
export declare function dodgeStat(skill: Skill, enemy: Entity, comparedStat: Stat): void;
export declare function combatBuffByRange(skill: Skill, ally: Entity, range: number, buffs: Stats): void;
export declare function combatBuffByMovementType(skill: Skill, ally: Entity, movementType: MovementType, buffs: Stats): void;
/**
 * If unit has 50% HP or less, add specified Map Buffs
 */
export declare function defiant(skill: Skill, stat: Stat, buff: number): void;
/**
 * If enemy has specified weapon and unit has specified % of HP, prevents enemy from doing a followup, and guarantees unit followup on them.
 */
export declare function breaker(skill: Skill, enemy: Entity, targetWeaponType: WeaponType, hpPercentage: number): void;
/**
 * Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.
 */
export declare function raven(skill: Skill, enemy: Entity): void;
/**
 * Grants Combat Buffs if unit is adjacent to ally
 */
export declare function bond(skill: Skill, state: GameState, buffs: Stats): void;
/**
 * Fire, Water, Wind, etc. Boosts: if HP >= enemy HP + 3, apply specified Combat Buffs
 */
export declare function elementalBoost(skill: Skill, target: Entity, buffs: Stats): void;
/**
 * If `shouldActivate` is met, heal unit.
 */
export declare function renewal(skill: Skill, shouldActivate: boolean, amount: number): void;
/**
 * If enemy is 2 or less spaces away from unit, apply specified debuffs
 */
export declare function threaten(skill: Skill, state: GameState, statDebuffs: Stats): void;
/**
 * Lowers target's map stats by specified debuffs. Lowers enemies' map stats by specified debuffs, if they are max. 2 tiles away from target.
 */
export declare function dagger(skill: Skill, state: GameState, target: Entity, debuffs: Stats): void;
export declare function counterattack(skill: Skill): void;
/**
 * Add Combat Buffs to all stats matching 2 * adjacent units count
 */
export declare function owl(skill: Skill, state: GameState): void;
/**
 * Add Combat Buffs to Atk = total map buffs on unit. Ignores Penalties.
 */
export declare function blade(skill: Skill): void;
/**
 * Make two entities swap spaces. Make sure the `checker` function returns true before calling the runner.
 */
export declare function swap(state: GameState, entity1: Entity, entity2: Entity): {
    checker(): boolean;
    runner(): void;
};
/**
 * Push an entity in the opposite direction of the effect caller, within the defined range, and to a valid tile. The target entity cannot bypass entities that are in the Shove path, but
 * may cross unpassable terrain.
 */
export declare function shove(state: GameState, entity1: Entity, entity2: Entity, range: number): void;
//# sourceMappingURL=effects.d.ts.map