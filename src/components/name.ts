import { Component } from "ape-ecs";

/**
 * Hero's display name.
 */
class Name extends Component {
    static properties = {
        value: "",
        description: ""
    };
};

export default Name;
