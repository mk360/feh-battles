import { Component } from "ape-ecs";

/**
 * Tile where a Hero could potentially warp to.
 */
class WarpTile extends Component {
    static properties = {
        x: 0,
        y: 0
    }
};

export default WarpTile;
