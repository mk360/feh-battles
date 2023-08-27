declare const effects: readonly ["followup", "damageIncrease", "counterattack", "staffDamageLikeOtherWeapons", "damageReduction", "cancelledAffinity", "gemWeapon", "reverseAffinity", "mapBuff", "vantage", "desperation", "braveWeapon", "combatBuff", "combatDebuff", "damageReduction", "additionalMovement", "effectiveness", "lowerOfDefAndRes", "artificialAffinity", "slowCooldown", "fastCooldown"];
export declare type CursorEffects = (typeof effects)[number];
export declare class Cursor {
    private currentValue;
    resetValue(): this;
    decreaseValue(valueDifference: number): this;
    getCurrentValue(): number;
    increaseValue(valueDifference: number): this;
}
export declare type CursorsReference = {
    [k in CursorEffects]?: Cursor;
};
declare function createCursorsReference(): CursorsReference;
export { createCursorsReference };
//# sourceMappingURL=cursor.d.ts.map