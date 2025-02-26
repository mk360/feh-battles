import { Component } from "ape-ecs";

/**
 * Increases damage just for one round (either an absolute value or a % of the initial damage amount)
 */
class RoundDamageIncrease extends Component {
    static properties = {
        value: 0,
        percentage: 0,
    }
};

export default RoundDamageIncrease;