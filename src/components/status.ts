import { Component, EntityRef } from "ape-ecs";

/**
 * Generic component that denotes a Status. Used by the UI to simplify Status display.
 */
class Status extends Component {
    static properties = {
        value: "",
        source: EntityRef
    };
};

export default Status;
