import GameWorld from "./world";

const world = new GameWorld({
    trackChanges: true
});

world.initiate({
    team1: [{
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: "Threaten Atk 3",
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3
        }
    }],
    team2: [{
        name: "Klein: Silver Nobleman",
        weapon: "Silver Bow",
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: "Threaten Atk 3",
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 2,
            y: 3
        }
    }]
});

world.runSystems("every-turn");

world.runSystems("combat");
