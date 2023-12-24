import GameWorld from "./world";
import Map1 from "./data/maps/map1.json";

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
            x: 2,
            y: 3
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
            x: 2,
            y: 5
        }
    }]
});

// console.time("combat");
// world.runSystems("combat");
// console.timeEnd("combat");
