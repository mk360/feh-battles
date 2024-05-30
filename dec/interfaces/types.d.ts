export type Stat = "atk" | "def" | "res" | "spd" | "hp";
export type CombatStats = {
    [stat in Exclude<Stat, "hp">]: number;
};
export type MandatoryStats = CombatStats & {
    hp: number;
};
export type Stats = Partial<MandatoryStats>;
export type WeaponColor = "red" | "blue" | "green" | "colorless";
export type WeaponType = "sword" | "lance" | "axe" | "bow" | "breath" | "tome" | "staff" | "dagger" | "beast";
export type MovementType = "infantry" | "armored" | "cavalry" | "flier";
export type PassiveSlot = "A" | "B" | "C" | "S";
//# sourceMappingURL=types.d.ts.map