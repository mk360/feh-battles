import { Component } from "ape-ecs";

/**
 * Standard Heal effect outside of combat.
 */
class Heal extends Component {
    static properties = {
        value: 0,
        newHP: 0
    }
};

export default Heal;
