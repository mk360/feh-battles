import { Entity } from "ape-ecs";
import GameState from "../systems/state";

function getAllies(state: GameState, hero: Entity) {
    return (state.teams[hero.getOne("Side").value] as Entity[]).filter(i => i.id !== hero.id);
};

export default getAllies;
