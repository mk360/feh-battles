import { Component } from "ape-ecs";
declare class DamageReduction extends Component {
    static properties: {
        amount: number;
        /**
         * Subtractive percentage: if a skill reduces damage by 70%, set property to 0.7
         */
        percentage: number;
        source: string;
    };
}
export default DamageReduction;
//# sourceMappingURL=damage-reduction.d.ts.map