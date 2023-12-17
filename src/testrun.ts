import GameWorld from "./world";
import Map1 from "./data/maps/map1.json";

const world = new GameWorld({
    trackChanges: true
});

world.generateMap(Map1);

world.initiate({
    team1: [{
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: {
            assist: null,
            special: null,
            A: "Fury 3",
            B: null,
            C: "Threaten Atk 3",
            S: "Fury 3",
        },
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3
        }
    }],
    team2: [{
        name: "Sigurd: Holy Knight",
        weapon: "Silver Sword+",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: "Crusader's Ward",
            C: "Threaten Atk 3",
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 5
        }
    }]
});
console.time("combat");
world.runSystems("combat");
console.timeEnd("combat");
