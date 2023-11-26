import { Component, EntityRef } from "ape-ecs";
declare class SkillSlot extends Component {
    static properties: {
        slot: string;
        skill: typeof EntityRef;
    };
}
export default SkillSlot;
//# sourceMappingURL=skill-slot.d.ts.map