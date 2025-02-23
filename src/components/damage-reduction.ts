import { Component } from "ape-ecs";

/**
 * Damage decrease that applies in all of the combat. Percentage is subtractive (if a skill reduces damage by 70%, set property to 0.7)
 */
class DamageReduction extends Component {
    static properties = {
        amount: 0,
        percentage: 0,
        source: ""
    }
};

export default DamageReduction;
