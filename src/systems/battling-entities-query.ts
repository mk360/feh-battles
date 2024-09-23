import { System } from "ape-ecs";

function battlingEntitiesQuery(system: System) {
    const attackerQuery = system.createQuery().fromAll("InitiateCombat");
    const defenderQuery = system.createQuery().not("InitiateCombat").fromAny("Battling", "PreviewingBattle");


    return function () {
        const attackerSet = attackerQuery.refresh().execute();
        const defenderSet = defenderQuery.refresh().execute();

        return {
            attacker: Array.from(attackerSet)[0],
            defender: Array.from(defenderSet)[0]
        }
    }
};

export default battlingEntitiesQuery;
