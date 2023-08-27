import BaseSkill, { SkillSlot, BaseSkillArgument, SkillEffect, Effect } from "./base_skill";

interface SpecialArgument extends BaseSkillArgument {
    cooldown: number
    trigger?(effect: SkillEffect): number | Effect[];
    shouldTrigger?(effect: SkillEffect): boolean;
};

class Special extends BaseSkill {
    baseCooldown = 0;
    defaultCooldown = 0;
    currentCooldown = 0;
    trigger: (args: SkillEffect) => number | Effect[];
    shouldTrigger: (args: SkillEffect) => boolean;
    constructor(specialInformations?: SpecialArgument) {
        super(specialInformations);
        super.setSlot("special");
        this.description = specialInformations.description;
        this.baseCooldown = specialInformations.cooldown;
        this.defaultCooldown = specialInformations.cooldown;
        this.currentCooldown = specialInformations.cooldown;
        if (specialInformations.shouldTrigger) {
            this.shouldTrigger = specialInformations.shouldTrigger;
        }
        if (specialInformations.trigger) {
            this.trigger = specialInformations.trigger;
        }
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
