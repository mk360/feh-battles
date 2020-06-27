import Hero from "./hero";

export type SkillSlot = "weapon" | "assist" | "special" | "A" | "B" | "C" | "S";


export interface SkillEffect {
    wielder?: Hero,
    enemy?: Hero,
    ally?: Hero,
    damage?: number,
    attackTurn?: number,
    defenseTurn?: number
};

export interface BaseSkillArgument {
    name: string
    slot?: SkillSlot
};

interface BaseSkill extends BaseSkillArgument {
    onEquip?: (newWielder: Hero) => void
    onInitiate?: (effect: SkillEffect) => void,
    onDefense?: (effect: SkillEffect) => void
    onBeforeCombat?: (effect: SkillEffect) => void
    onStartTurn?: (effect: SkillEffect) => void
    onAllyInitiate?: (effect: SkillEffect) => void
    onAllyDefense?: (effect: SkillEffect) => void
    onBeforeAllyCombat?: (effect: SkillEffect) => void
};

abstract class BaseSkill {
    constructor(baseSkill?: BaseSkillArgument) {
        if (baseSkill) {
            this.setName(baseSkill.name);
            if (baseSkill.slot) this.setSlot(baseSkill.slot);
        }
    };
    setSlot(slot: SkillSlot) {
        this.slot = slot;
        return this;
    };
    setName(name: string) {
        this.name = name;
        return this;
    };
};

export default BaseSkill;
