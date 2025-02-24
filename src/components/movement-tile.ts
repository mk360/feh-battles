import { Component } from "ape-ecs";

/**
 * Set of coordinates where a Hero can move.
 */
class MovementTile extends Component {
    static properties = {
        x: 0,
        y: 0
    }
};

export default MovementTile;
