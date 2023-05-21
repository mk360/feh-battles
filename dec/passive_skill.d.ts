import BaseSkill, { BaseSkillArgument } from "./base_skill";
import { WeaponType } from "./weapon";
import { MovementType } from "./types";
declare type PassiveSkillSlot = "A" | "B" | "C" | "S";
interface PassiveSkill extends BaseSkill {
    slot: PassiveSkillSlot;
    description: string;
    allowedUsers?: Array<MovementType | WeaponType>;
}
interface PassiveSkillArgument extends BaseSkillArgument {
    slot: PassiveSkillSlot;
}
declare class PassiveSkill extends BaseSkill {
    constructor(passiveSkillInformations?: PassiveSkillArgument);
    setSlot(slot: PassiveSkillSlot): this;
    setDescription(description: string): this;
}
export default PassiveSkill;
//# sourceMappingURL=passive_skill.d.ts.map