import PassiveSkill from "./passive_skill";
import Weapon from "./weapon";

export interface HeroSkills {
    weapon?: Weapon,
    A?: PassiveSkill,
    B?: PassiveSkill,
    C?: PassiveSkill
    S?: PassiveSkill
};

export interface Stats {
    hp?: number,
    atk?: number,
    spd?: number,
    def?: number,
    res?: number
};

export interface MandatoryStats {
    hp: number
    atk: number
    spd: number
    def: number
    res: number
};

export type StatEnum = "atk" | "def" | "res" | "hp" | "spd"

export interface StatsBuffsTable {
    atk?: number,
    spd?: number,
    def?: number,
    res?: number
};

export type MapCoordinates = {
    x: number,
    y: number,
};

export type MovementType = "infantry" | "flier" | "armored" | "cavalry";

export type heroBuffs = "statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses";
export type heroDebuffs = "panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma";
