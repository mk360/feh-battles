import { System } from "ape-ecs";
import GameState from "./state";
import WEAPONS from "../data/weapons";

class MapEffectsSystem extends System {
    private state: GameState;

    init(state: GameState) {
        this.state = state;
    };

    update() {
        const teamMembers = this.getCurrentTeam();
        for (let member of teamMembers) {
            const skills = member.getComponents("Skill");
            skills.forEach((skill) => {
                if (WEAPONS[skill.name].onTurnStart) {
                    WEAPONS[skill.name].onTurnStart.call(skill, this.state);
                }
            });
        }
    }

    getCurrentTeam() {
        const entities = Array.from(this.createQuery().from("Side").execute());

        return entities.filter(entity => entity.c.Team.value === this.state.currentSide);
    }
};

export default MapEffectsSystem;
