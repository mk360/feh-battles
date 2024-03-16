import { Query, System } from "ape-ecs";
import GameState from "./state";
import WEAPONS from "../data/weapons";
import PASSIVES from "../data/passives";

const MAP_STATUSES = ["MapBuff", "MapDebuff", "FinishedAction"];

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
        const teamMembers = this.getCurrentTeam();
        for (let member of teamMembers) {
            const skillMap = this.state.skillMap.get(member);
            if (skillMap.onTurnStart) {
                for (let skill of skillMap.onTurnStart) {
                    const dict = skill.slot === "weapon" ? WEAPONS : PASSIVES;
                    dict[skill.name].onTurnStart.call(skill, this.state);
                }
            }
        }
        // @ts-ignore
        console.log("changes", this._stagedChanges);
    }

    getCurrentTeam() {
        const entities = Array.from(this.heroesQuery.execute());
        return entities.filter(entity => entity.getOne("Side").value === this.state.currentSide);
    }
};

export default TurnStartSystem;
