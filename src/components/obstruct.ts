import { Component } from "ape-ecs";

/**
 * One Component added to the Hero = one Tile they can't cross.
 */
class Obstruct extends Component {
    static properties = {
        x: 0,
        y: 0
    };

    static serializeFields = ["x", "y"];
};

export default Obstruct;
