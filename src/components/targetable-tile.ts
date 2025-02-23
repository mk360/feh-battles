import { Component } from "ape-ecs";

/**
 * Tiles that have an enemy that a Hero can actually fight.
 */
class TargetableTile extends Component {
    static properties = {
        x: 0,
        y: 0
    };
};

export default TargetableTile;
