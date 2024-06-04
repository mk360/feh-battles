import { Component, EntityRef } from "ape-ecs";
declare class DealDamage extends Component {
    static properties: {
        damage: number;
        turnIndex: number;
        special: boolean;
        cooldown: number;
        heal: number;
        target: typeof EntityRef;
        targetTriggersSpecial: boolean;
        targetHP: number;
        targetCooldown: number;
    };
}
export default DealDamage;
//# sourceMappingURL=deal-damage.d.ts.map