import BaseSkill from "./base_skill";
import { WeaponType } from "./weapon";
import { MovementType } from "./types";
declare type PassiveSkillSlot = "A" | "B" | "C" | "S";
interface PassiveSkill extends BaseSkill {
    slot: PassiveSkillSlot;
    allowedUsers?: Array<MovementType | WeaponType>;
}
declare class PassiveSkill extends BaseSkill {
    constructor(passiveSkillInformations?: PassiveSkill);
    setSlot(slot: PassiveSkillSlot): this;
}
export default PassiveSkill;
//# sourceMappingURL=passive_skill.d.ts.map