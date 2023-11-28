import { Component } from "ape-ecs";

class MovementType extends Component {};

MovementType.properties = {
    value: "",
    range: 0
};

export default MovementType;
