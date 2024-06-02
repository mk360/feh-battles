import { System } from "ape-ecs";
import GameState from "./state";

class AssistSystem extends System {
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
    }

    update(): void {

    }
};

export default AssistSystem;
