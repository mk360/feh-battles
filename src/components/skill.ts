import { Component } from "ape-ecs";

/**
 * Generic Skill slot
 */
class Skill extends Component {
    static properties = {
        name: "",
        description: "",
        slot: "",
        might: 0,
        displayName: "",
    }
}

export default Skill;
