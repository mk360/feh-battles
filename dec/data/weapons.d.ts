import { Component } from "ape-ecs";
interface WeaponDict {
    [k: string]: {
        description: string;
        onCombatStart(context: any): Component[];
    };
}
declare const WEAPONS: WeaponDict;
export default WEAPONS;
//# sourceMappingURL=weapons.d.ts.map