export type CursorEffects = "followup" | "addedDamageMod" | "subtractedDamageMod" | "counterattack" | "staffDamageLikeOtherWeapons" | "damageReduction" | "cancelledAffinity" | "gemWeapon" | "artificialAffinity" | "reverseAffinity" | "mapBuff" | "vantage" | "desperation" | "braveWeapon" | "combatBuff" | "combatDebuff" | "additionalMovement" | "effectiveness" | "lowerOfDefAndRes";

const effects: CursorEffects[] = ["followup", "addedDamageMod", "subtractedDamageMod", "counterattack", "staffDamageLikeOtherWeapons", "damageReduction", "cancelledAffinity", "gemWeapon", "reverseAffinity", "mapBuff", "vantage", "desperation", "braveWeapon", "combatBuff", "combatDebuff", "damageReduction", "additionalMovement", "effectiveness", "lowerOfDefAndRes", "artificialAffinity"];

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
