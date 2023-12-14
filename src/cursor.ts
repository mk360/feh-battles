const effects = ["followup", "damageIncrease", "counterattack", "staffDamageLikeOtherWeapons", "damageReduction", "flatDamageReduction", "cancelledAffinity", "gemWeapon", "reverseAffinity", "mapBuff", "vantage", "desperation", "braveWeapon", "combatBuff", "combatDebuff", "damageReduction", "additionalMovement", "effectiveness", "lowerOfDefAndRes", "artificialAffinity", "slowCooldown", "fastCooldown"] as const;

export type CursorEffects = (typeof effects)[number];

export class Cursor {
    private currentValue = 0;

    resetValue() {
        this.currentValue = 0;
        return this;
    };

    decreaseValue(valueDifference: number) {
        this.currentValue -= valueDifference;
        return this;
    };

    getCurrentValue() {
        return this.currentValue;
    };

    multiplyValue(multiplier: number) {
        this.currentValue *= multiplier;
        return this;
    }

    divideValue(divisor: number) {
        this.currentValue /= divisor;
        return this;
    }

    setValue(value: number) {
        this.currentValue = value;
        return this;
    }

    increaseValue(valueDifference: number) {
        this.currentValue += valueDifference;
        return this;
    };
};

export type CursorsReference = {
    [k in CursorEffects]?: Cursor
};

function createCursorsReference() {
    let cursorsReference: CursorsReference = {};
    for (let key of effects) {
        cursorsReference[key] = new Cursor();
    }
    return cursorsReference;
};

export { createCursorsReference };
