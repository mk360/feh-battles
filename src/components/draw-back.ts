import { Component } from "ape-ecs";

/**
 * (TODO) Retreat Hero by 1 tile towards the specified Coordinates
 */
class DrawBack extends Component {
    static properties = {
        x: 0,
        y: 0,
    };
};

export default DrawBack;
