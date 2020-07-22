import PassiveSkill from "./passive_skill";
import Weapon from "./weapon";
export interface HeroSkills {
    weapon?: Weapon;
    A?: PassiveSkill;
    B?: PassiveSkill;
    C?: PassiveSkill;
    S?: PassiveSkill;
}
export interface Stats {
    hp?: number;
    atk?: number;
    spd?: number;
    def?: number;
    res?: number;
}
export interface MandatoryStats {
    hp: number;
    atk: number;
    spd: number;
    def: number;
    res: number;
}
export declare type StatEnum = "atk" | "def" | "res" | "hp" | "spd";
export interface StatsBuffsTable {
    atk?: number;
    spd?: number;
    def?: number;
    res?: number;
}
export declare type MapCoordinates = {
    x: 1 | 2 | 3 | 4 | 5 | 6;
    y: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};
export declare type MovementTypeEnum = "infantry" | "flier" | "armored" | "cavalry";
export interface MovementType {
    type: MovementTypeEnum;
    tiles: 1 | 2 | 3;
}
export declare type heroBuffs = "statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses";
export declare type heroDebuffs = "panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma";
//# sourceMappingURL=types.d.ts.map