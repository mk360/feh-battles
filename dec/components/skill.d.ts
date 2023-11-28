import { Component, EntityRef } from "ape-ecs";
declare class Skill extends Component {
    static properties: {
        name: string;
        description: string;
        slot: string;
        wielder: typeof EntityRef;
    };
}
export default Skill;
//# sourceMappingURL=skill.d.ts.map