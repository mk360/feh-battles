import { Component } from "ape-ecs";

/**
 * Damage from AoE specials, skills that damage opponents outside of combat (for ex. Poison Strike)
 */
class AoEDamage extends Component {
    static properties = {
        value: 0,
        remainingHP: 0
    }
};

export default AoEDamage;
