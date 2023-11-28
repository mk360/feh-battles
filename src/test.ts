import checkBattleEffectiveness from "./systems/effectiveness";
import GameWorld from "./world";

const world = new GameWorld();

world.initiate({
    team1: [{
        name: "Klein: Silver Nobleman",
        skills: {
            weapon: "Iron Bow",
            A: null,
            assist: null,
            B: null,
            C: null,
            S: null,
            special: null,
        },
        rarity: 5,
        initialPosition: {
            x: 4,
            y: 5
        }
    }],
    team2: [{
        name: "Clair: Highborn Flier",
        skills: {
            weapon: "Shielding Lance",
            A: null,
            assist: null,
            special: null,
            B: null,
            C: null,
            S: null,
        },
        rarity: 5,
        initialPosition: {
            x: 3,
            y: 5
        }
    }]
});

const x = world.getEntities("Weapon");
const [klein, clair] = x;

console.log(klein.getObject());
