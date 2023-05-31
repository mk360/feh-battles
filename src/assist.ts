import BaseSkill, { BaseSkillArgument } from "./base_skill";
import Hero from "./hero";

interface AssistArguments extends BaseSkillArgument {
    range: number;
    canApplyAssist: ({
        wielder,
        target
    }: { wielder: Hero; target: Hero }) => boolean;
}

class Assist extends BaseSkill {
    constructor(assistConstructor?: AssistArguments) {
        super();
        super.setSlot("assist");
    }
};

export default Assist;
