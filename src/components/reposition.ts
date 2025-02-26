import { Component, EntityRef } from "ape-ecs";

/**
 * Applies an effect similar to the Reposition assist. Hero moves another to their opposite side.
 */
class Reposition extends Component {
    static properties = {
        targetEntity: EntityRef,
        x: 0,
        y: 0,
    };
};

export default Reposition;
