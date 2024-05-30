import { Component, EntityRef } from "ape-ecs";
declare class DealDamage extends Component {
    static properties: {
        damage: number;
        turnIndex: number;
        special: boolean;
        target: typeof EntityRef;
    };
}
export default DealDamage;
//# sourceMappingURL=deal-damage.d.ts.map