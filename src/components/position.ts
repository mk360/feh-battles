import { Component } from "ape-ecs";

class Position extends Component {
    static properties = {
        x: 0,
        y: 0
    };

    static serializeFields = ["x", "y"];
};

export default Position;
