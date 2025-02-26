import { Component } from "ape-ecs";

/**
 * Decreases damage just for one round (either an absolute value or a % of the initial damage amount)
 */
class RoundDamageReduction extends Component {
    static properties = {
        value: 0,
        percentage: 0,
    }
};

export default RoundDamageReduction;
