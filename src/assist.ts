import BaseSkill, { BaseSkillArgument } from "./base_skill";
import Hero from "./hero";

interface AssistArguments extends BaseSkillArgument {
    range: number;
    canRun?: ({
        wielder,
        target
    }: { wielder: Hero; target: Hero }) => boolean;
}

class Assist extends BaseSkill {
    constructor(assistConstructor?: AssistArguments) {
        super(assistConstructor);
        super.setSlot("assist");
    }
};

export default Assist;
