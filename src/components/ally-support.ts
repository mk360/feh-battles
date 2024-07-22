import { Component, EntityRef } from "ape-ecs";

class AllySupport extends Component {
    static properties = {
        ally: EntityRef,
        level: "",
    };
};

export default AllySupport;
