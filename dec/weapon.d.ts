import BaseSkill, { SkillSlot } from "./base_skill";
import { MovementType } from "./types";
export declare type weaponColor = "red" | "blue" | "green" | "colorless";
export declare type weaponCategory = "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast";
declare type weaponRange = 1 | 2;
interface Weapon extends BaseSkill {
    might: number;
    category: weaponCategory;
    color?: weaponColor;
    range: weaponRange;
    effectiveAgainst?: (weaponCategory | MovementType)[];
}
declare class Weapon extends BaseSkill {
    constructor(weaponInformations?: Weapon);
    private throwIncompatibleError;
    setColor(color: weaponColor): this;
    setRange(range: weaponRange): this;
    setEffectiveness(...targets: (weaponCategory | MovementType)[]): this;
    setCategory(category: weaponCategory): this;
    setSlot(slot: SkillSlot): this;
    setMight(might: number): this;
}
export default Weapon;
//# sourceMappingURL=weapon.d.ts.map