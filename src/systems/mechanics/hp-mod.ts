import { Query, System } from "ape-ecs";

const SUBSCRIBED_COMPONENTS = ["Stats"];

class HPModSystem extends System {
    private healableQuery: Query;

    init() {
        this.healableQuery = this.createQuery().fromAny("Heal", "MapDamage");
        this.subscribe("MapDamage");
        this.subscribe("Heal");
        for (let component of SUBSCRIBED_COMPONENTS) {
            this.subscribe(component);
        }
    }

    update() {
        const entities = this.healableQuery.refresh().execute();
        entities.forEach((entity) => {
            let { hp: oldHP, maxHP } = entity.getOne("Stats").getObject(false);
            let trackedHP = oldHP;
            const damageComponents = entity.getComponents("MapDamage");
            const sacrificeComponents = entity.getComponents("SacrificeHP");

            damageComponents.forEach((damageComp) => {
                const { value } = damageComp.getObject(false);
                trackedHP = Math.max(1, trackedHP - value);
                entity.removeComponent(damageComp);
            });

            sacrificeComponents.forEach((sacrificeComp) => {
                const { value } = sacrificeComp.getObject(false);
                trackedHP = Math.max(1, trackedHP - value);
                entity.removeComponent(sacrificeComp);
            });
            const healComponents = entity.getComponents("Heal");

            healComponents.forEach((healComp) => {
                trackedHP = Math.min(maxHP, trackedHP + healComp.value);
                entity.removeComponent(healComp);
            });

            let healthDifference = trackedHP - oldHP;

            entity.getOne("Stats").update({
                hp: trackedHP,
            });

            if (healthDifference > 0) {
                entity.addComponent({
                    type: "Heal",
                    value: Math.abs(healthDifference),
                    newHP: trackedHP
                });
            } else if (healthDifference < 0) {
                entity.addComponent({
                    type: "MapDamage",
                    value: Math.abs(healthDifference),
                    remainingHP: trackedHP
                });
            }
        });
    }
};

export default HPModSystem;
