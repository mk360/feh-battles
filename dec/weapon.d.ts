import BaseSkill, { BaseSkillArgument, SkillSlot } from "./base_skill";
import { MovementType } from "./types";
export declare type WeaponColor = "red" | "blue" | "green" | "colorless";
export declare type WeaponType = "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast";
interface Weapon extends BaseSkill {
    might: number;
    slot: "weapon";
    type: WeaponType;
    color?: WeaponColor;
    range: number;
    effectiveAgainst?: (WeaponType | MovementType)[];
}
interface WeaponOptions extends BaseSkillArgument {
    might: number;
    type: WeaponType;
    color?: WeaponColor;
    range: number;
}
declare class Weapon extends BaseSkill {
    constructor(weaponInformations?: WeaponOptions);
    private throwIncompatibleError;
    setColor(color: WeaponColor): this;
    setDescription(description: string): this;
    setRange(range: number): this;
    setEffectiveness(...targets: (WeaponType | MovementType)[]): this;
    setType(type: WeaponType): this;
    setSlot(slot: SkillSlot): this;
    setMight(might: number): this;
}
export default Weapon;
//# sourceMappingURL=weapon.d.ts.map