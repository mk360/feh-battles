import { Component } from "ape-ecs";

/**
 * A Hero's Special.
 */
class Special extends Component {
    static properties = {
        name: "",
        description: "",
        baseCooldown: 0,
        maxCooldown: 0,
        cooldown: 0
    };
};

export default Special;
