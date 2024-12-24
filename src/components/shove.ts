import { Component, EntityRef } from "ape-ecs";

class Shove extends Component {
    static properties = {
        x: 0,
        y: 0,
        target: EntityRef,
    }
};

export default Shove;
