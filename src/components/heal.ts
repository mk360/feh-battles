import { Component } from "ape-ecs";

class Heal extends Component {
    static properties = {
        value: 0,
        newHP: 0
    }
};

export default Heal;
