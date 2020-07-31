import BaseSkill, { SkillSlot } from "./base_skill";
import { MovementType } from "./types";

export type weaponColor = "red" | "blue" | "green" | "colorless";
export type weaponCategory = "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast";
type weaponRange = 1 | 2;

interface Weapon extends BaseSkill {
    might: number,
    category: weaponCategory,
    color?: weaponColor,
    range: weaponRange,
    effectiveAgainst?: (weaponCategory | MovementType)[]
};

interface WeaponOptions {
    name: string
    might: number
    category: weaponCategory
    color?: weaponColor
    range: weaponRange
};

class Weapon extends BaseSkill {
    constructor(weaponInformations?: WeaponOptions) {
        super();
        super.setSlot("weapon");
        if (weaponInformations) {
            this.setName(weaponInformations.name);
            this.setMight(weaponInformations.might);
            this.setCategory(weaponInformations.category);
            if (!this.color) this.setColor(weaponInformations.color);
        }
    };

    private throwIncompatibleError(color: weaponColor, category: weaponCategory) {
        throw new Error(`Incompatible combination between color ${this.color} and weapon ${category}`);
    };

    setColor(color: weaponColor) {
        if (["staff", "axe", "sword", "lance", "staff"].includes(this.category)) {
            if (isIncompatible(color, this.category)) {
                this.throwIncompatibleError(color, this.category);
            }
        } else {
            this.color = color;
        }
        return this;
    };

    setRange(range: weaponRange) {
        this.range = range;
        return this;
    };

    setEffectiveness(...targets: (weaponCategory | MovementType)[]) {
        this.effectiveAgainst = targets;
        return this;
    };

    setCategory(category: weaponCategory) {
        if (this.color) {
            if (isIncompatible(this.color, category)) {
                this.throwIncompatibleError(this.color, category);
            }
        }

        this.category = category;
        if (["axe", "sword", "lance", "beast", "dragonstone"].includes(category)) {
            this.setRange(1);
            if (["axe", "sword", "lance"].includes(category)) {
                this.setColor({
                    axe: "green",
                    sword: "red",
                    lance: "blue"
                }[category]);
            }
        } else {
            this.setRange(2);
            if (category === "staff") {
                this.setColor("colorless");
            }
        }
        return this;
    };

    setSlot(slot: SkillSlot) {
        let warnText = "Unable to redefine slot for a weapon";
        if (this.name) warnText += ` (weapon ${this.name})`;
        console.warn(warnText);
        return this;
    };

    setMight(might: number) {
        this.might = might;
        return this;
    };
};

function isIncompatible(color: weaponColor, weapon: weaponCategory) {
    return (
        color === "red" && ["axe", "lance", "staff"].includes(weapon) ||
        color === "blue" && ["axe", "sword", "staff"].includes(weapon) ||
        color === "green" && ["sword", "lance", "staff"].includes(weapon) ||
        color === "colorless" && ["sword", "lance", "axe"].includes(weapon)
    );
};

export default Weapon;
