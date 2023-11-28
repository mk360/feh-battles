import { System } from "ape-ecs";
import GameState from "./state";

class MapEffectsSystem extends System {
    private state: GameState;

    init(state: GameState) {
        this.state = state;
    };

    getTeam(team: string) {
        const entities = Array.from(this.createQuery().from("Side").execute());

        return entities.filter(entity => entity.c.Team.value === team);
    }
};

export default MapEffectsSystem;
