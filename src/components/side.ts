import { Component } from "ape-ecs";

/**
 * A Hero's team.
 */
class Side extends Component { }

Side.properties = {
    value: "",
    bitfield: 0
};

export default Side;
