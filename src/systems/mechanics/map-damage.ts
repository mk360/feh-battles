import { Query, System } from "ape-ecs";
import GameState from "../state";

class MapDamage extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().fromAll("MapDamage");
        this.subscribe("Stats");
    }

    update() {
        const entities = this.query.refresh().execute();

        entities.forEach((entity) => {
            const { value } = entity.getOne("MapDamage");
            const { hp } = entity.getOne("Stats");
            const newHP = Math.max(0, hp - value);
            entity.getOne("Stats").update({
                hp: newHP
            });
        });
    }
};

export default MapDamage;
