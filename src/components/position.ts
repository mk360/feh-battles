import { Component } from "ape-ecs";

/**
 * Current coordinates for any Hero.
 */
class Position extends Component {
    static properties = {
        x: 0,
        y: 0
    };

    static serializeFields = ["x", "y"];

    static changeEvents = true;
};

export default Position;
