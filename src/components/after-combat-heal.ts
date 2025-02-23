import { Component } from "ape-ecs";

/**
 * Healing that is applied after combat ends (ex. Breath of Life)
 */
class AfterCombatHeal extends Component {
    static properties = {
        value: 0
    }
};

export default AfterCombatHeal;
