import { World } from "ape-ecs";

class GameWorld extends World {
    constructor() {
        super({
            cleanupPools: true,
        });
    }
};

export default GameWorld;
