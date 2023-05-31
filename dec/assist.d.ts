import BaseSkill, { BaseSkillArgument } from "./base_skill";
interface AssistArguments extends BaseSkillArgument {
    range: number;
}
declare class Assist extends BaseSkill {
    constructor(assistConstructor?: AssistArguments);
}
export default Assist;
//# sourceMappingURL=assist.d.ts.map