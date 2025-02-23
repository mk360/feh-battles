import { Component } from "ape-ecs";

/**
 * (currently unused) Deals Map Damage before the combat begins
 */
class BeforeCombatDamage extends Component {
    static properties = {
        value: 0
    }
};

export default BeforeCombatDamage;
