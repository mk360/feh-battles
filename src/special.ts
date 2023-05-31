import BaseSkill, { SkillSlot, BaseSkillArgument } from "./base_skill";

interface SpecialArgument extends BaseSkillArgument {
    cooldown: number
};

class Special extends BaseSkill {
    constructor(specialInformations?: SpecialArgument) {
        super(specialInformations);
        super.setSlot("special");
        this.description = specialInformations.description;
    };

    setDescription(desc: string) {
        this.description = desc;
        return this;
    };

    setSlot(slot: SkillSlot) {
        let warnText = "Unable to redefine slot for a special";
        if (this.name) warnText += ` (${this.name})`;
        console.warn(warnText);
        return this;
    };
};

export default Special;
