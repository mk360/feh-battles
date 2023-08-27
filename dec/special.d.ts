import BaseSkill, { SkillSlot, BaseSkillArgument, SkillEffect, Effect } from "./base_skill";
interface SpecialArgument extends BaseSkillArgument {
    cooldown: number;
    trigger?(effect: SkillEffect): number | Effect[];
    shouldTrigger?(effect: SkillEffect): boolean;
}
declare class Special extends BaseSkill {
    baseCooldown: number;
    defaultCooldown: number;
    currentCooldown: number;
    trigger: (args: SkillEffect) => number | Effect[];
    shouldTrigger: (args: SkillEffect) => boolean;
    constructor(specialInformations?: SpecialArgument);
    setDescription(desc: string): this;
    setSlot(slot: SkillSlot): this;
}
export default Special;
//# sourceMappingURL=special.d.ts.map