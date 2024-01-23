import { Query, System } from "ape-ecs";
import GameState from "./state";
import WEAPONS from "../data/weapons";
import PASSIVES from "../data/passives";

class MapEffectsSystem extends System {
    private state: GameState;
    private heroesQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.heroesQuery = this.createQuery().fromAll("Side");
    };

    update() {
        const teamMembers = this.getCurrentTeam();
        for (let member of teamMembers) {
            const skills = member.getComponents("Skill");
            skills.forEach((skill) => {
                const dict = skill.slot === "weapon" ? WEAPONS : PASSIVES;
                if (dict[skill.name].onTurnStart) {
                    dict[skill.name].onTurnStart.call(skill, this.state);
                }
            });
        }
    }

    getCurrentTeam() {
        const entities = Array.from(this.heroesQuery.execute());
        return entities.filter(entity => entity.getOne("Side").value === this.state.currentSide);
    }
};

export default MapEffectsSystem;