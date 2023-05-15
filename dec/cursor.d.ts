declare const effects: readonly ["followup", "addedDamageMod", "subtractedDamageMod", "counterattack", "staffDamageLikeOtherWeapons", "damageReduction", "cancelledAffinity", "gemWeapon", "reverseAffinity", "mapBuff", "vantage", "desperation", "braveWeapon", "combatBuff", "combatDebuff", "damageReduction", "additionalMovement", "effectiveness", "lowerOfDefAndRes", "artificialAffinity"];
export declare type CursorEffects = (typeof effects)[number];
export interface Cursor {
    getCurrentValue: () => number;
    decreaseValue: (valueDifference: number) => Cursor;
    increaseValue: (valueDifference: number) => Cursor;
    resetValue: () => Cursor;
}
export declare class Cursor {
    constructor();
}
export declare type CursorsReference = {
    [k in CursorEffects]?: Cursor;
};
declare function createCursorsReference(): CursorsReference;
export { createCursorsReference };
//# sourceMappingURL=cursor.d.ts.map