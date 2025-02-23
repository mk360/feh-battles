import { Component } from "ape-ecs";

/**
 * Tile that a Hero could theoretically attack
 */
class AttackTile extends Component {
    static properties = {
        x: 0,
        y: 0
    }
};

export default AttackTile;
