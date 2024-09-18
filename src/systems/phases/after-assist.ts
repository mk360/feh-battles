import { Query, System } from "ape-ecs";
import GameState from "../state";
import ASSISTS from "../../data/assists";
import SKILLS from "../../data/skill-dex";

class AssistSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().from("Assisting");
    }

    update(): void {
        const [assisting, assisted] = this.query.execute();
        const assistSkill = assisting.getOne("Assist");
        const assistData = ASSISTS[assistSkill.name];
        if (assistSkill && assistData) {
            const assistedAfterAssistEffects = this.state.skillMap.get(assisted);
            const assistingAfterAssistEffects = this.state.skillMap.get(assisting);

            assistingAfterAssistEffects.onAllyAssistAfter?.forEach((skill) => {
                const skillData = SKILLS[skill.name];
                skillData.onAssistAfter.call(null, this.state, assisting, skill);
            });

            assistedAfterAssistEffects.onAllyAssistAfter?.forEach((skill) => {
                const skillData = SKILLS[skill.name];
                skillData.onAllyAssistAfter.call(null, this.state, assisting, skill);
            });
        }
    }
};

export default AssistSystem;