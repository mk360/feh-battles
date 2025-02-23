import { Component } from "ape-ecs";

/**
 * Healing that happens during a combat round
 */
class CombatHeal extends Component {
    static properties = {
        amount: 0,
        percentage: 0
    }
};

export default CombatHeal;
