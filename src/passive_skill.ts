import BaseSkill, { BaseSkillArgument } from "./base_skill";
import { weaponCategory } from "./weapon";
import { MovementType } from "./types";

type PassiveSkillSlot = "A" | "B" | "C";

interface PassiveSkill extends BaseSkill {
    slot: PassiveSkillSlot,
    allowedUsers?: Array<MovementType | weaponCategory>
};

class PassiveSkill extends BaseSkill {
    constructor(passiveSkillInformations?: PassiveSkill) {
        super(passiveSkillInformations);
    };
    setSlot(slot: PassiveSkillSlot) {
        this.slot = slot;
        return this;
    };
};

export default PassiveSkill;
