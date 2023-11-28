interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        range: number;
        onCombatStart?(...args: any[]): any;
        onDamageReceived?(...args: any[]): any;
        onEquip?(...args: any[]): any;
    };
}
declare const WEAPONS: WeaponDict;
export default WEAPONS;
//# sourceMappingURL=weapons.d.ts.map