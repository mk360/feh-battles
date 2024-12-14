import { Component, EntityRef } from "ape-ecs";

class Reposition extends Component {
    static properties = {
        targetEntity: EntityRef,
        x: 0,
        y: 0,
    };
};

export default Reposition;
