import BaseSkill, { BaseSkillArgument } from "./base_skill";
import Hero from "./hero";
interface AssistArguments extends BaseSkillArgument {
    range: number;
    canApplyAssist: ({ wielder, target }: {
        wielder: Hero;
        target: Hero;
    }) => boolean;
}
declare class Assist extends BaseSkill {
    constructor(assistConstructor?: AssistArguments);
}
export default Assist;
//# sourceMappingURL=assist.d.ts.map