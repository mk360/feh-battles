import { Entity, Query, System } from "ape-ecs";
import GameState from "../state";
import ASSISTS from "../../data/assists";
import getAllies from "../../utils/get-allies";
import SKILLS from "../../data/skill-dex";

class AfterAssist extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().fromAny("Assisting", "Assisted", "PreviewAssist");
    }

    update(): void {
        const [assisting, assisted] = this.query.refresh().execute();
        if (assisting) {
            const assistSkill = ASSISTS[assisting.getOne("Assist").name];
            const skillMap = this.state.skillMap.get(assisting).onAssistAfter;
            skillMap.forEach((skill) => {
                const assistData = SKILLS[skill.name];
                assistData.onAssistAfter?.call(skill, this.state, assisted, assistSkill);
            });

            const assistedSkillMap = this.state.skillMap.get(assisted).onAllyAssistAfter;
            assistedSkillMap.forEach((skill) => {
                const assistData = SKILLS[skill.name];
                assistData.onAllyAssistAfter?.call(skill, this.state, assisting, assistSkill);
            });

            const allies = getAllies(this.state, assisting).filter((i) => i !== assisted);

            for (let ally of allies) {
                this.state.skillMap.get(ally).onAllyAssistAfter?.forEach((skill) => {
                    SKILLS[skill.name].onAllyAssistAfter.call(skill, this.state, assisting, assistSkill);
                });
            }
        }
    }
};

export default AfterAssist;
