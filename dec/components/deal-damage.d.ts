import { Component, EntityRef } from "ape-ecs";
declare class DealDamage extends Component {
    static properties: {
        round: number;
        attacker: {
            hp: number;
            entity: typeof EntityRef;
            heal: number;
            triggerSpecial: boolean;
            specialCooldown: number;
            turn: number;
            damage: number;
        };
        target: {
            hp: number;
            entity: typeof EntityRef;
            heal: number;
            triggerSpecial: boolean;
            specialCooldown: number;
            turn: number;
            damage: number;
        };
    };
}
export default DealDamage;
//# sourceMappingURL=deal-damage.d.ts.map