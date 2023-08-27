import BattleState from "./battle_state";
import Hero from "./hero";
import { MovementType, StatsBuffsTable } from "./types";
import { WeaponType } from "./weapon";
export declare type SkillSlot = "weapon" | "assist" | "special" | "A" | "B" | "C" | "S";
export interface SkillEffect {
    wielder?: Hero;
    enemy?: Hero;
    ally?: Hero;
    battleState?: BattleState;
    damage?: number;
    attackTurn?: number;
    attacker?: Hero;
    defender?: Hero;
    defenseTurn?: number;
}
export interface BaseSkillArgument {
    name: string;
    description: string;
    slot?: SkillSlot;
    protectsAgainst?: (WeaponType | MovementType)[];
}
export interface Effect {
    targetHeroId: string;
    appliedEffect: {
        stats?: StatsBuffsTable;
        status?: [];
    };
}
interface BaseSkill extends BaseSkillArgument {
    onEquip?: (newWielder: Hero) => void;
    onInitiate?: (effect: SkillEffect) => void;
    onDefense?: (effect: SkillEffect) => void;
    onBeforeCombat?: (effect: SkillEffect) => void;
    onAllyInitiate?: (effect: SkillEffect) => void;
    onAllyDefense?: (effect: SkillEffect) => void;
    onBeforeAllyCombat?: (effect: SkillEffect) => void;
    onTurnStart?: (effect: SkillEffect) => Effect[];
    onRoundAttack?: (effect: SkillEffect) => void;
    onRoundDefense?: (effect: SkillEffect) => void;
    onAfterCombat?: (effect: SkillEffect) => Effect[];
}
declare abstract class BaseSkill {
    constructor(baseSkill?: BaseSkillArgument);
    setSlot(slot: SkillSlot): this;
    setName(name: string): this;
    setDescription(description: string): this;
}
export default BaseSkill;
//# sourceMappingURL=base_skill.d.ts.map