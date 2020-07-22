import Hero from "./hero";
export declare type SkillSlot = "weapon" | "assist" | "special" | "A" | "B" | "C" | "S";
export interface SkillEffect {
    wielder?: Hero;
    enemy?: Hero;
    ally?: Hero;
    damage?: number;
    attackTurn?: number;
    defenseTurn?: number;
}
export interface BaseSkillArgument {
    name: string;
    slot?: SkillSlot;
}
interface BaseSkill extends BaseSkillArgument {
    onEquip?: (newWielder: Hero) => void;
    onInitiate?: (effect: SkillEffect) => void;
    onDefense?: (effect: SkillEffect) => void;
    onBeforeCombat?: (effect: SkillEffect) => void;
    onStartTurn?: (effect: SkillEffect) => void;
    onAllyInitiate?: (effect: SkillEffect) => void;
    onAllyDefense?: (effect: SkillEffect) => void;
    onBeforeAllyCombat?: (effect: SkillEffect) => void;
}
declare abstract class BaseSkill {
    constructor(baseSkill?: BaseSkillArgument);
    setSlot(slot: SkillSlot): this;
    setName(name: string): this;
}
export default BaseSkill;
//# sourceMappingURL=base_skill.d.ts.map