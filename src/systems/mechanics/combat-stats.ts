import { System } from "ape-ecs";
import GameState from "../state";
import battlingEntitiesQuery from "../battling-entities-query";

class CombatStatsSystem extends System {
    private state: GameState;
    private battlingQuery = battlingEntitiesQuery(this);

    init(state: GameState) {
        this.state = state;
    }

    update(): void {
        const { attacker, defender } = this.battlingQuery();
        
    }
};

export default CombatStatsSystem;
