

const effects = ["followup", "addedDamageMod", "subtractedDamageMod", "counterattack", "staffDamageLikeOtherWeapons", "damageReduction", "cancelledAffinity", "gemWeapon", "artificalAffinity", "reverseAffinity", "mapBuff", "vantage", "desperation", "braveWeapon", "fightBuff", "fightDebuff", "damageReduction", "additionalMovement", "effectiveness", "lowerOfDefAndRes"];

export interface Cursor {
    getCurrentValue: () => number,
    decreaseValue: (valueDifference: number) => Cursor,
    increaseValue: (valueDifference: number) => Cursor,
    resetValue: () => Cursor
};

export class Cursor {
    constructor() {
        let currentValue = 0;
        this.getCurrentValue = function () {
            return currentValue;
        };
        this.decreaseValue = (valueDifference) => {
            currentValue = -Math.max(currentValue, valueDifference);
            return this;
        };
        this.increaseValue = (valueDifference) => {
            currentValue = Math.max(currentValue, valueDifference);
            return this;
        };
        this.resetValue = () => {
            currentValue = 0;
            return this;
        };
    };
};

function createCursorsReference() {
    let cursorsReference = {};
    for (let effect of effects) {
        cursorsReference[effect] = new Cursor();
    }
    return cursorsReference;
};

export { createCursorsReference };
