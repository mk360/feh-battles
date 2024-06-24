import { Entity } from "ape-ecs";
import GameState from "../systems/state";

function getEnemies(state: GameState, hero: Entity) {
    const { value } = hero.getOne("Side");
    const teamKeys = Object.keys(state.teams);
    teamKeys.splice(teamKeys.indexOf(value), 1);
    const otherSide = teamKeys[0];
    return Array.from(state.teams[otherSide]);
};

export default getEnemies;
