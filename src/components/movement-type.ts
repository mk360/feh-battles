import { Component } from "ape-ecs";

/**
 * Movement Type from Hero's properties
 */
class MovementType extends Component { };

MovementType.properties = {
    value: "",
    range: 0,
    bitfield: 0
};

export default MovementType;
