import { Component } from "ape-ecs";

/**
 * Damage that is inflicted outside of combat (AoE, Poison Strike, etc.).
 */
class MapDamage extends Component {
    static properties = {
        value: 0,
        remainingHP: 0,
    }
};

export default MapDamage;
