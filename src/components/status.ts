import { Component, EntityRef } from "ape-ecs";

class Status extends Component {
    static properties = {
        value: "",
        source: EntityRef
    };
};

export default Status;
