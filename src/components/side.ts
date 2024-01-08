import { Component } from "ape-ecs";

class Side extends Component {}

Side.properties = {
    value: "team1",
    bitfield: 0
};

export default Side;
