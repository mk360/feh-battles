import Assist from "./assist";
import PassiveSkill from "./passive_skill";
import Special from "./special";
import Weapon from "./weapon";

export interface HeroSkills {
    weapon?: Weapon;
    assist?: Assist;
    special?: Special;
    A?: PassiveSkill;
    B?: PassiveSkill;
    C?: PassiveSkill;
    S?: PassiveSkill;
};

export interface Stats {
    hp?: number,
    atk?: number,
    spd?: number,
    def?: number,
    res?: number
};

export type MandatoryStats = Required<Stats>;

export type Stat = keyof MandatoryStats;

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
export type StatusBuff = "statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses";
export type StatusDebuff = "panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma" | "guard";
