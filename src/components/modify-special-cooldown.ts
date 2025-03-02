import { Component } from "ape-ecs";

/**
 * Change the special cooldown value (e.g. with skills that accelerate or slow special cooldowns).
 */
class ModifySpecialCooldown extends Component {
    static properties = {
        value: 0
    }
};

export default ModifySpecialCooldown;
