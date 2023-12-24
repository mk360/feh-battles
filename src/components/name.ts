import { Component } from "ape-ecs";

class Name extends Component {
    static properties = {
        value: ""
    };

    static serializeFields = ["value"]
};

export default Name;
