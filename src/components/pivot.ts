import { Component } from "ape-ecs";

/**
 * Runs an effect similar to the Pivot assist (Hero moves past an ally by one tile).
 */
class Pivot extends Component {
    static properties = {
        x: 0,
        y: 0
    };
};

export default Pivot;
