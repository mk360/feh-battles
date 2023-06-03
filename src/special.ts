import BaseSkill, { SkillSlot, BaseSkillArgument } from "./base_skill";

interface SpecialArgument extends BaseSkillArgument {
    cooldown: number
};

class Special extends BaseSkill {
    baseCooldown = 0;
    defaultCooldown = 0;
    currentCooldown = 0;
    constructor(specialInformations?: SpecialArgument) {
        super(specialInformations);
        super.setSlot("special");
        this.description = specialInformations.description;
        this.baseCooldown = specialInformations.cooldown;
        this.defaultCooldown = specialInformations.cooldown;
        this.currentCooldown = specialInformations.cooldown;
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
