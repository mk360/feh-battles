import GameWorld from "./world";
import Map1 from "./data/maps/map1.json";
import SkillDex from "./data/skill-dex";

console.log("pulling imports and data", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));

const world = new GameWorld({
    trackChanges: true
});

console.log("initial world setup", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));

world.generateMap(Map1);

console.log("with a map", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));

world.initiate({
    team1: [{
        name: "Klein: Silver Nobleman",
        weapon: "Argent Bow",
        skills: {
            assist: null,
            special: "Iceberg",
            A: "Death Blow 3",
            B: null,
            C: "Threaten Atk 3",
            S: "Def +3",
        },
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3
        }
    }],
    team2: [{
        name: "Sigurd: Holy Knight",
        weapon: "Tyrfing",
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
    }, {
        name: "Berkut: Prideful Prince",
        weapon: "Dark Royal Spear",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: "Spur Atk 3",
            S: "Spur Def 3"
        },
        rarity: 5,
        initialPosition: {
            x: 3,
            y: 5
        }
    }]
});
// console.time("combat");
// world.runSystems("movement");
// console.timeEnd("combat");
// console.log(process.memoryUsage().heapUsed / 1024 / 1024);
