import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";

function generateTurns(attacker: Entity, defender: Entity, attackerCombatStats: Stats, defenderCombatStats: Stats) {
    let turns: Entity[] = [];
    const defenderIsAllowed = defenderCanDefend(attacker, defender);

    if (defender.getOne("Vantage") && defenderIsAllowed) {
        turns = turns.concat(generateRoundUnit(defender));
    }

    turns = turns.concat(generateRoundUnit(attacker));

    if (defenderIsAllowed) {
        turns = turns.concat(generateRoundUnit(defender));
    }

    if ((attackerCombatStats.spd >= defenderCombatStats.spd + 5 || attacker.getOne("GuaranteedFollowup")) && !defender.getOne("PreventFollowup")) {
        turns = turns.concat(generateRoundUnit(attacker));
    }

    if (defenderIsAllowed && (attackerCombatStats.spd + 5 <= defenderCombatStats.spd || defender.getOne("GuaranteedFollowup")) && !attacker.getOne("PreventFollowup")) {
        turns = turns.concat(generateRoundUnit(defender));
    }

    return turns;
};

function generateRoundUnit(entity: Entity) {
    const subTurn = [entity];

    if (entity.getOne("BraveWeapon")) {
        subTurn.push(entity);
    }

    return subTurn;
};

export function defenderCanDefend(attacker: Entity, defender: Entity) {
    const attackerPreventedCounterattacks = attacker.getOne("PreventCounterattack");
    const defenderHasWeapon = !!Array.from(defender.getComponents("Skill")).find((i) => i.slot === "weapon");
    const isCounterattackAllowed = Boolean(defender.getOne("Counterattack")) && !attackerPreventedCounterattacks && defenderHasWeapon;
    const rangeIsTheSame = defenderHasWeapon && attacker.getOne("Weapon").range === defender.getOne("Weapon").range;

    if (rangeIsTheSame) {
        return !attackerPreventedCounterattacks;
    }

    return isCounterattackAllowed;
}

export default generateTurns;
