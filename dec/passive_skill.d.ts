import BaseSkill from "./base_skill";
import { weaponCategory } from "./weapon";
import { MovementType } from "./types";
declare type PassiveSkillSlot = "A" | "B" | "C";
interface PassiveSkill extends BaseSkill {
    slot: PassiveSkillSlot;
    allowedUsers?: Array<MovementType | weaponCategory>;
}
declare class PassiveSkill extends BaseSkill {
    constructor(passiveSkillInformations?: PassiveSkill);
    setSlot(slot: PassiveSkillSlot): this;
}
export default PassiveSkill;
//# sourceMappingURL=passive_skill.d.ts.map