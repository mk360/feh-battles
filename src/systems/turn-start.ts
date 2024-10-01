import { Query, System } from "ape-ecs";
import GameState from "./state";
import SKILLS from "../data/skill-dex";

const MAP_STATUSES = ["MapBuff", "MapDebuff", "Special", "Status"];

class TurnStartSystem extends System {
    private state: GameState;
    private heroesQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.heroesQuery = this.createQuery().fromAll("Side");
        for (let status of MAP_STATUSES) {
            this.subscribe(status);
        }
    };

    update() {
        const entities = Array.from(this.heroesQuery.refresh().execute());
        const teamMembers = entities.filter(entity => entity.getOne("Side").value === this.state.currentSide);
        for (let member of teamMembers) {
            const skillMap = this.state.skillMap.get(member);

            const finishAction = member.getOne("FinishedAction");

            if (finishAction) {
                member.removeComponent(finishAction);
            }

            if (skillMap.onTurnStartBefore) {
                for (let skill of skillMap.onTurnStartBefore) {
                    SKILLS[skill.name].onTurnStartBefore.call(skill, this.state);
                }
            }

            if (skillMap.onTurnStart) {
                for (let skill of skillMap.onTurnStart) {
                    SKILLS[skill.name].onTurnStart.call(skill, this.state);
                }
            }

            if (skillMap.onTurnStartAfter) {
                for (let skill of skillMap.onTurnStartBefore) {
                    SKILLS[skill.name].onTurnStartBefore.call(skill, this.state);
                }
            }
        }
    }
};

export default TurnStartSystem;
