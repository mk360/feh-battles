import { Component } from "ape-ecs";
declare class Special extends Component {
    static properties: {
        name: string;
        description: string;
        baseCooldown: number;
        maxCooldown: number;
        cooldown: number;
    };
}
export default Special;
//# sourceMappingURL=special.d.ts.map