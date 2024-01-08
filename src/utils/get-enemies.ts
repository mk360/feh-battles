import { Entity } from "ape-ecs";
import GameState from "../systems/state";

function getEnemies(state: GameState, hero: Entity) {
    const { value } = hero.getOne("Side");
    const otherSide = value === "team1" ? "team2" : "team1";
    return Array.from(state.teams[otherSide]);
};

export default getEnemies;
