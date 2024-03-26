import { Query, System } from "ape-ecs";
import GameState from "./state";

class AfterCombatSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().fromAll()
    }

    update() {

    }
}

export default AfterCombatSystem;
