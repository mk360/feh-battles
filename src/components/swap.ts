import { Component, EntityRef } from "ape-ecs";

/**
 * Runs the Swap effect. Hero and target swap tiles.
 */
class Swap extends Component {
    static properties = {
        assistTarget: {
            entity: EntityRef,
            x: 0,
            y: 0
        },
        x: 0,
        y: 0,
    };
};

export default Swap;
