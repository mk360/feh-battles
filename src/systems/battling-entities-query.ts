import { System } from "ape-ecs";

function battlingEntitiesQuery(system: System) {
    const previewQuery = system.createQuery().fromAll("PreviewingBattle");
    const battlingQuery = system.createQuery().fromAll("Battling");

    return () => {
        let [attacker, defender] = previewQuery.refresh().execute();
        if (!attacker && !defender) {
            console.log(battlingQuery.refresh().execute());
            [attacker, defender] = battlingQuery.refresh().execute();
        }

        return {
            attacker,
            defender
        }
    }
};

export default battlingEntitiesQuery;
