import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { Stat } from "../types";
import getAllies from "../utils/get-alies";

export function honeStat(thisArg: Skill, state: GameState, stat: Stat, buff: number) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, thisArg.entity) === 1) {
            ally.addComponent({
                type: "MapBuff",
                [stat]: buff
            });
        }
    }
}
