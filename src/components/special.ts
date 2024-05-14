import { Component } from "ape-ecs";

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
