import { Component, EntityRef } from "ape-ecs";

class Skill extends Component {
    static properties = {
        name: "",
        description: "",
        slot: "",
        wielder: EntityRef
    }
}

export default Skill;
