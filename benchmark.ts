import * as http from "http";
import GameWorld from "./src/world";
import siege from "siege";

const server = http.createServer((req, res) => {
    new GameWorld();
    res.end();
});

server.listen(3000);

siege().on(3000).for(100_000).times.get("/").attack();

