import { Query, System } from "ape-ecs";

const SUBSCRIBED_COMPONENTS = ["Stats"];

class HPModSystem extends System {
    private healableQuery: Query;

    init() {
        this.healableQuery = this.createQuery().fromAll("Heal", "MapDamage");
        this.subscribe("MapDamage");
        this.subscribe("Heal");
        for (let component of SUBSCRIBED_COMPONENTS) {
            this.subscribe(component);
        }
    }

    update() {
        const entities = this.healableQuery.refresh().execute();
        entities.forEach((entity) => {
            let healthDifference = 0;
            const healComponents = entity.getComponents("Heal");
            const damageComponents = entity.getComponents("MapDamage");

            healComponents.forEach((healComp) => {
                healthDifference += healComp.value;
                entity.removeComponent(healComp);
            });

            damageComponents.forEach((damageComp) => {
                healthDifference -= damageComp.value;
                entity.removeComponent(damageComp);
            });

            const { hp, maxHP } = entity.getOne("Stats").getObject(false);

            const clamped = Math.max(1, Math.min(hp + healthDifference, maxHP));

            entity.getOne("Stats").update({
                hp: clamped,
            });

            if (healthDifference > 0) {
                entity.addComponent({
                    type: "Heal",
                    value: healthDifference,
                    newHP: clamped
                });
            } else if (healthDifference < 0) {
                entity.addComponent({
                    type: "MapDamage",
                    value: healthDifference,
                    remainingHP: clamped
                });
            }
        });
    }
};

export default HPModSystem;
