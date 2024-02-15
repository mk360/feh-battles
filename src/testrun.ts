import GameWorld from "./world";
import Map1 from "./data/maps/map1.json";
import Debugger from "./debugger";

const world = new GameWorld({
    trackChanges: true
});

// world.generateMap(Map1);

world.initiate({
    team1: [{
        name: "Subaki: Perfect Expert",
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
    }]
});

world.getEntities("Name").forEach((v) => {
    console.log(v.getOne("Stats").getObject(false));
})


// const debug = new Debugger(world);

// debug.drawMap({
//     includeUnits: true,
//     highlightTiles: new Set<Uint16Array>()
// })
