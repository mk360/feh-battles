import BaseSkill, { BaseSkillArgument, SkillSlot } from "./base_skill";
import { MovementType } from "./types";

export type WeaponColor = "red" | "blue" | "green" | "colorless";
export type WeaponType = "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast";

interface Weapon extends BaseSkill {
    might: number,
    type: WeaponType,
    color?: WeaponColor,
    range: number,
    effectiveAgainst?: (WeaponType | MovementType)[]
};

interface WeaponOptions extends BaseSkillArgument {
    might: number
    type: WeaponType
    color?: WeaponColor
    range: number
};

class Weapon extends BaseSkill {
    constructor(weaponInformations?: WeaponOptions) {
        super();
        super.setSlot("weapon");
        this.effectiveAgainst = [];
        if (weaponInformations) {
            this.setName(weaponInformations.name);
            this.setMight(weaponInformations.might);
            this.setType(weaponInformations.type);
            if (!this.color) this.setColor(weaponInformations.color);
        }
    };

    private throwIncompatibleError(color: WeaponColor, category: WeaponType) {
        throw new Error(`Incompatible combination between color ${color} and weapon ${category}`);
    };

    setColor(color: WeaponColor) {
        if (["staff", "axe", "sword", "lance", "staff"].includes(this.type)) {
            if (isIncompatible(color, this.type)) {
                this.throwIncompatibleError(color, this.type);
                return;
            }
        }
        this.color = color;
        return this;
    };

    setDescription(description: string) {
        this.description = description;
        return this;
    }

    setRange(range: number) {
        this.range = range;
        return this;
    };

    setEffectiveness(...targets: (WeaponType | MovementType)[]) {
        this.effectiveAgainst = targets;
        return this;
    };

    setType(type: WeaponType) {
        if (this.color) {
            if (isIncompatible(this.color, type)) {
                this.throwIncompatibleError(this.color, type);
            }
        }

        this.type = type;
        if (["axe", "sword", "lance", "beast", "dragonstone"].includes(type)) {
            this.setRange(1);
            if (["axe", "sword", "lance"].includes(type)) {
                this.setColor({
                    axe: "green",
                    sword: "red",
                    lance: "blue"
                }[type]);
            }
        } else {
            this.setRange(2);
            if (type === "staff") {
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

function isIncompatible(color: WeaponColor, weapon: WeaponType) {
    return (
        color === "red" && ["axe", "lance", "staff"].includes(weapon) ||
        color === "blue" && ["axe", "sword", "staff"].includes(weapon) ||
        color === "green" && ["sword", "lance", "staff"].includes(weapon) ||
        color === "colorless" && ["sword", "lance", "axe"].includes(weapon)
    );
};

export default Weapon;
