import { Component } from "ape-ecs";

/**
 * The Assist skill of the hero
 */
class Assist extends Component {
    static properties = {
        name: "",
        description: "",
        range: 0
    }
};


export default Assist;
