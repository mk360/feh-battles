import { Component } from "ape-ecs";

class AoEDamage extends Component {
    static properties = {
        value: 0,
        remainingHP: 0
    }
};

export default AoEDamage;
