import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
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

export function mapBuffByMovementType(thisArg: Skill, state: GameState, movementType: MovementType, buffs: Stats) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (ally.getOne("MovementType").value === movementType) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
        }
    }
}

export function combatBuffByRange(thisArg: Skill, state: GameState, range: number, buffs: Stats) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, this.entity) <= range) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
        }
    }
}
