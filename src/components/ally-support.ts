import { Component, EntityRef } from "ape-ecs";

/**
 * Support rank between allies
 */
class AllySupport extends Component {
    static properties = {
        ally: EntityRef,
        level: "",
    };
};

export default AllySupport;
