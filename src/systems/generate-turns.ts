import { Entity } from "ape-ecs";
import getCombatStats from "./get-combat-stats";
import { Stats } from "../types";

function generateTurns(attacker: Entity, defender: Entity, attackerCombatStats: Stats, defenderCombatStats: Stats) {
    const turns: Entity[] = [];
    const defenderIsAllowed = defenderCanDefend(attacker, defender);
    if (defender.getOne("Vantage") && defenderIsAllowed) {
        turns.push(defender);
        if (defender.getOne("Desperation")) {
            turns.push(defender);
        }
    }

    turns.push(attacker);

    if (defenderIsAllowed) {
        turns.push(defender);
    }

    if (attackerCombatStats.spd >= defenderCombatStats.spd + 5) {
        turns.push(attacker);
    }

    if (attackerCombatStats.spd + 5 <= defenderCombatStats.spd) {
        turns.push(defender);
    }

    return turns;
};

function defenderCanDefend(attacker: Entity, defender: Entity) {
    return defender.getOne("Counterattack") || !attacker.getOne("PreventCounterattack");
}

export default generateTurns;
