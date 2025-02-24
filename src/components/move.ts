import { Component } from "ape-ecs";

/**
 * Make a Hero move into specified coordinates.
 */
class Move extends Component {
    static properties = {
        x: 0,
        y: 0
    }
}

export default Move;
