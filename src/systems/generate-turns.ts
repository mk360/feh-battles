import { Entity } from "ape-ecs";

function generateTurns(attacker: Entity, defender: Entity) {
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
};

function defenderCanDefend(attacker: Entity, defender: Entity) {
    return defender.getOne("Counterattack") || !attacker.getOne("PreventCounterattack");
}

export default generateTurns;
