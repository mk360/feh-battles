import BaseSkill, { BaseSkillArgument } from "./base_skill";
import { WeaponType } from "./weapon";
import { MovementType } from "./types";

type PassiveSkillSlot = "A" | "B" | "C";

interface PassiveSkill extends BaseSkill {
    slot: PassiveSkillSlot,
    allowedUsers?: Array<MovementType | WeaponType>
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
