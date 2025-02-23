import { Component } from "ape-ecs";

/**
 * Position that is considered for temporary calculations (assist preview, combat preview).
 */
class TemporaryPosition extends Component {
    static properties = {
        x: 0,
        y: 0,
    };

    static serializeFields = ["x", "y"];
};

export default TemporaryPosition;
