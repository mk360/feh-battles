import GameWorld from "./world";
import Map1 from "./data/maps/map1.json";
import Debugger from "./debugger";

const world = new GameWorld({
    trackChanges: true
});

world.generateMap(Map1);

world.initiate({
    team1: [{
        name: "Berkut: Prideful Prince",
        weapon: "Silver Lance",
        skills: {
            assist: null,
            special: "",
            A: null,
            B: null,
            C: null,
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 1,
            y: 1
        }
    }],
    team2: [{
        name: "Subaki: Perfect Expert",
        weapon: "Silver Lance+",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: null,
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 6,
            y: 8
        }
    }]
});

world.runSystems("movement");

const debug = new Debugger(world);

debug.drawMap({
    includeUnits: true,
    highlightTiles: new Set()
})
