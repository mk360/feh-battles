import GameWorld from "../../world";

const TEST_GAME_WORLD = new GameWorld({
    team1: "team1",
    team2: "team2"
});

TEST_GAME_WORLD.generateMap();

export default TEST_GAME_WORLD;