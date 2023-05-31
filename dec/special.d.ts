import BaseSkill, { SkillSlot, BaseSkillArgument } from "./base_skill";
interface SpecialArgument extends BaseSkillArgument {
    cooldown: number;
}
declare class Special extends BaseSkill {
    constructor(specialInformations?: SpecialArgument);
    setDescription(desc: string): this;
    setSlot(slot: SkillSlot): this;
}
export default Special;
//# sourceMappingURL=special.d.ts.map