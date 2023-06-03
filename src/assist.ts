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
    range = 0;
    constructor(assistConstructor?: AssistArguments) {
        super(assistConstructor);
        super.setSlot("assist");
        this.description = assistConstructor.description;
        this.range = assistConstructor.range;
    }

    setRange(range: number) {
        this.range = range;
        return this;
    }
};

export default Assist;
