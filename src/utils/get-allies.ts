import { Entity } from "ape-ecs";
import GameState from "../systems/state";

function getAllies(state: GameState, hero: Entity) {
    return Array.from(state.teams[hero.getOne("Side").value] as Set<Entity>).filter(i => i.id !== hero.id);
};

export default getAllies;
