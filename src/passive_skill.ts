import BaseSkill, { BaseSkillArgument } from "./base_skill";
import { WeaponType } from "./weapon";
import { MovementType } from "./types";

type PassiveSkillSlot = "A" | "B" | "C" | "S";

interface PassiveSkill extends BaseSkill {
    description: string;
    allowedUsers?: Array<MovementType | WeaponType>
};

interface PassiveSkillArgument extends BaseSkillArgument {
    slot: PassiveSkillSlot;
}

class PassiveSkill extends BaseSkill {
    constructor(passiveSkillInformations?: PassiveSkillArgument) {
        super(passiveSkillInformations);
    };
    setSlot(slot: PassiveSkillSlot) {
        this.slot = slot;
        return this;
    };
};

export default PassiveSkill;
