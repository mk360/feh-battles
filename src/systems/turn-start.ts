import { Query, System } from "ape-ecs";
import GameState from "./state";
import SKILLS from "../data/skill-dex";

const MAP_STATUSES = ["MapBuff", "MapDebuff", "FinishedAction", "Status"];

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
        const entities = Array.from(this.heroesQuery.execute());
        const teamMembers = entities.filter(entity => entity.getOne("Side").value === this.state.currentSide);
        for (let member of teamMembers) {
            const skillMap = this.state.skillMap.get(member);
            if (skillMap.onTurnStart) {
                for (let skill of skillMap.onTurnStart) {
                    SKILLS[skill.name].onTurnStart.call(skill, this.state);
                }
            }
        }
    }
};

export default TurnStartSystem;
