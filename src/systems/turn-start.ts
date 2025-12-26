import { Query, System } from "ape-ecs";
import GameState from "./state";
import SKILLS from "../data/skill-dex";
import addLogEntry from "../utils/log-entries/add-log-entry";

const MAP_STATUSES = ["MapBuff", "MapDebuff", "Special", "Status"];

class TurnStartSystem extends System {
    private state: GameState;
    private heroesQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.heroesQuery = this.createQuery().fromAll("Side");
        for (let status of MAP_STATUSES.concat(["Heal", "AoEDamage"])) {
            this.subscribe(status);
        }
    };

    update() {
        const entities = Array.from(this.heroesQuery.refresh().execute());
        const teamMembers = entities.filter(entity => entity.getOne("Side").value === this.state.currentSide);

        for (let member of teamMembers) {
            const skillMap = this.state.skillMap.get(member);

            if (skillMap.onTurnStartBefore) {
                for (let skill of skillMap.onTurnStartBefore) {
                    const components = SKILLS[skill.name].onTurnStartBefore.call(skill, this.state);
                    for (let component of components) {
                        addLogEntry(component, member, component.entity, skill.name, this.state.history);
                    }
                }
            }

            if (skillMap.onTurnStart) {
                for (let skill of skillMap.onTurnStart) {
                    const components = SKILLS[skill.name].onTurnStart.call(skill, this.state);
                    for (let component of components) {
                        addLogEntry(component, member, component.entity, skill.name, this.state.history);
                    }
                }
            }

            if (skillMap.onTurnStartAfter) {
                for (let skill of skillMap.onTurnStartAfter) {
                    const components = SKILLS[skill.name].onTurnStartAfter.call(skill, this.state);
                    for (let component of components) {
                        addLogEntry(component, member, component.entity, skill.name, this.state.history);
                    }
                }
            }
        }

        this.world.runSystems("special-cooldown");
        this.world.runSystems("hp-mod");
    }
};

export default TurnStartSystem;
