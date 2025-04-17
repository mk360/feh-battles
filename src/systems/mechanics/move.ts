import { Query, System } from "ape-ecs";
import GameState from "../state";
import getPosition from "../get-position";
import clearTile from "../clear-tile";

class MoveSystem extends System {
    private query: Query;
    private state: GameState;

    init(state: GameState) {
        this.state = state;
        this.query = this.createQuery().fromAny("Move");

        this.subscribe("Position");
    }

    update() {
        const unitsToMove = this.query.refresh().execute();

        unitsToMove.forEach((entity) => {
            const { x, y } = entity.getOne("Position");
            // it should strictly be this Position and not the getPosition() fct, because
            // then it might try to delete a tile that wasn't occupied in the first place
            const mapTile = this.state.map[y][x] as Uint16Array;
            this.state.occupiedTilesMap.delete(mapTile);
            clearTile(mapTile);
        });

        unitsToMove.forEach((entity) => {
            const moveComponent = entity.getOne("Move");
            if (moveComponent) {
                const { bitfield } = entity.getOne("Side");
                const positionComponent = entity.getOne("Position");
                const { x, y } = moveComponent;
                const mapTile = this.state.map[y][x] as Uint16Array;
                this.state.occupiedTilesMap.set(mapTile, entity);
                mapTile[0] |= bitfield;
                positionComponent.update({ x, y });
                entity.removeComponent(moveComponent);
            }
        });
    }
};

export default MoveSystem;
