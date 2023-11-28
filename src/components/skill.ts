import { Component } from "ape-ecs";

class Skill extends Component {
    static properties = {
        name: "",
        description: "",
        slot: "",
    }
}

export default Skill;
