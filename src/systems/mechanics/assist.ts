import { Entity, Query, System } from "ape-ecs";
import GameState from "../state";
import ASSISTS from "../../data/assists";
import getAllies from "../../utils/get-allies";
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
            // todo pour plus tard : ajouter des "onAssist" aux skills qui s'activent après un assist (pour les trucs du genre Snare, le B de Mordecai, etc.)
            assistData.onApply.call(assisting, this.state, assisted);
            const assistedAfterAssistEffects = this.state.skillMap.get(assisted);
            const assistingAfterAssistEffects = this.state.skillMap.get(assisting);

            assistedAfterAssistEffects.onAllyAssistAfter?.forEach((skill) => {
                const skillData = SKILLS[skill.name];
                skillData.onAssistAfter.call(skill,)
            });
        }
    }
};

export default AssistSystem;
