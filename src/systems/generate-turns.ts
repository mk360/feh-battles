import { Entity } from "ape-ecs";
import { Stats } from "../types";

function generateTurns(attacker: Entity, defender: Entity, attackerCombatStats: Stats, defenderCombatStats: Stats) {
    const turns: Entity[] = [];
    const defenderIsAllowed = defenderCanDefend(attacker, defender);
    if (defender.getOne("Vantage") && defenderIsAllowed) {
        turns.push(defender);
    }

    turns.push(attacker);

    if (defenderIsAllowed) {
        turns.push(defender);
    }

    if (attackerCombatStats.spd >= defenderCombatStats.spd + 5) {
        turns.push(attacker);
    }

    if (attackerCombatStats.spd + 5 <= defenderCombatStats.spd && defenderIsAllowed) {
        turns.push(defender);
    }

    return turns;
};

function defenderCanDefend(attacker: Entity, defender: Entity) {
    const attackerPreventedCounterattacks = attacker.getOne("PreventCounterattack");
    const isCounterattackAllowed = defender.getOne("Counterattack") && !attackerPreventedCounterattacks;
    const rangeIsTheSame = attacker.getOne("Weapon").range === defender.getOne("Weapon").range;

    if (rangeIsTheSame) {
        return !attackerPreventedCounterattacks;
    }

    return isCounterattackAllowed;
}

export default generateTurns;
