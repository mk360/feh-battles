import { Component } from "ape-ecs";

class MapDamage extends Component {
    static properties = {
        value: 0,
        remainingHP: 0,
    }
};

export default MapDamage;
