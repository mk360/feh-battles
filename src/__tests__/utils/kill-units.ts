import { Entity } from "ape-ecs";
import TEST_GAME_WORLD from "../constants/world";

function killUnits(entities: Entity[]) {
    return function () {
        for (let entity of entities) {
            entity.addComponent({
                type: "Kill"
            });
            TEST_GAME_WORLD.runSystems("kill");
        }
    };
};

export default killUnits;
