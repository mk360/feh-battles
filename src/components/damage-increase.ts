import { Component } from "ape-ecs"

/**
 * Damage increase that applies to every attack during combat
 */
export default class DamageIncrease extends Component {
    static properties = {
        amount: 0,
        percentage: 0
    };
};
