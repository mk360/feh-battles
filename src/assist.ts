import BaseSkill, { BaseSkillArgument } from "./base_skill";

interface AssistArguments extends BaseSkillArgument {
    range: number;
}

class Assist extends BaseSkill {
    constructor(assistConstructor?: AssistArguments) {
        super();
        super.setSlot("assist");
    }
};

export default Assist;
