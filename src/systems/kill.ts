import { Query, System } from "ape-ecs";
import GameState from "./state";
import Position from "../components/position";

class KillSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState) {
        this.state = state;
        this.query = this.createQuery().from("Kill");
    };

    update() {
        const [deadUnit] = this.query.refresh().execute();

        if (deadUnit) {
            const { value } = deadUnit.getOne("Side");
            const castTeam = value as "team1" | "team2";
            const { value: movementType } = deadUnit.getOne("MovementType");
            const { value: weaponType } = deadUnit.getOne("WeaponType");
            const position = deadUnit.getOne(Position);
            const mapTile = this.state.map[position.y][position.x];
            this.state.occupiedTilesMap.delete(mapTile);
            // free map tile
            this.state.teams[castTeam].delete(deadUnit);
            this.state.teamsByMovementTypes[castTeam][movementType]--;
            this.state.teamsByWeaponTypes[castTeam][weaponType]--;
            deadUnit.destroy();
        }
    }
};

export default KillSystem;
