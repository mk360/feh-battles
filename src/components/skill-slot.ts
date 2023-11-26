import { Component,  EntityRef } from "ape-ecs";

class SkillSlot extends Component {
    static properties = {
        slot: "",
        skill: EntityRef
    };
};

export default SkillSlot;