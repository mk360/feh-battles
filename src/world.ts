import { World } from "ape-ecs";
import Weapon from "./components/weapon";
import UnitStatsSystem from "./systems/unit-stats";

class GameWorld extends World {
    constructor() {
        super({
            cleanupPools: true,
        });

        this.registerComponent(Weapon);
        this.registerSystem("every-turn", UnitStatsSystem);
    }
};

export default GameWorld;
