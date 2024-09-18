import { Query, System } from "ape-ecs";
import GameState from "../state";

const SUBSCRIBED_COMPONENTS = ["Stats"];

class HealSystem extends System {
    private healableQuery: Query;

    init(state: GameState): void {
        this.healableQuery = this.createQuery().fromAll("Heal", "MapDamage");
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

            const { hp, maxHP, ...rest } = entity.getOne("Stats").getObject(false);

            const clamped = Math.max(1, Math.min(hp + healthDifference, maxHP));

            entity.getOne("Stats").update({
                hp: clamped,
                maxHP,
                ...rest
            });
        });
    }
};

export default HealSystem;
