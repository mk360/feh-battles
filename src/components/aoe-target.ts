import { Component } from "ape-ecs";

/**
 * Target for an AoE special
 */
class AoETarget extends Component {
    static properties = {
        value: 0
    }
};

export default AoETarget;
