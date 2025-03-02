import GameWorld from "../../world";
import TEAM_IDS from "./teamIds";

const TEST_GAME_WORLD = new GameWorld({
    team1: TEAM_IDS[0],
    team2: TEAM_IDS[1]
});

TEST_GAME_WORLD.generateMap();

export default TEST_GAME_WORLD;