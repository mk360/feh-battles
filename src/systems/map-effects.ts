import { Query, System } from "ape-ecs";
import GameState from "./state";
import WEAPONS from "../data/weapons";

class MapEffectsSystem extends System {
    private state: GameState;
    private heroesQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.heroesQuery = this.createQuery().fromAll("Side");
    };

    update() {
        const teamMembers = this.getCurrentTeam();
        console.log("req", teamMembers);
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
        const entities = Array.from(this.heroesQuery.execute());
        console.log(entities[0]);
        return entities.filter(entity => entity.c.Side.value === this.state.currentSide);
    }
};

export default MapEffectsSystem;
