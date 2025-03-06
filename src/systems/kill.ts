import { Query, System } from "ape-ecs";
import GameState from "./state";
import Position from "../components/position";
import clearTile from "./clear-tile";

class KillSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState) {
        this.state = state;
        this.query = this.createQuery().fromAll("Kill");
    };

    update() {
        const deadUnits = this.query.refresh().execute();
        // console.log(Array.from(deadUnits).map((i) => i.getOne("Name").value));
        deadUnits.forEach((deadUnit) => {
            if (deadUnit) {
                const { value } = deadUnit.getOne("Side");
                const { value: movementType } = deadUnit.getOne("MovementType");
                const { weaponType } = deadUnit.getOne("Weapon");
                const position = deadUnit.getOne(Position);
                const mapTile = this.state.map[position.y][position.x];
                this.state.occupiedTilesMap.delete(mapTile);
                this.state.skillMap.delete(deadUnit);
                clearTile(mapTile);
                this.state.teams[value].delete(deadUnit);
                this.state.teamsByMovementTypes[value][movementType]--;
                this.state.teamsByWeaponTypes[value][weaponType]--;
                deadUnit.destroy();
            }
        });
    }
};

export default KillSystem;
