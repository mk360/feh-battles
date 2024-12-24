import { System } from "ape-ecs";

class SpecialCooldownSystem extends System {
    private query = this.createQuery().fromAll('ModifySpecialCooldown');

    update() {
        this.query.refresh().execute().forEach((entity) => {
            if (!entity.getOne("Special")) {
                // if for some reason a unit that doesn't have a special gets caught up in the query, don't operate on them
            } else {
                let total = 0;
                entity.getComponents("ModifySpecialCooldown").forEach((comp) => {
                    total += comp.value;
                });
                const { maxCooldown, cooldown } = entity.getOne("Special");
                const newCooldown = Math.max(Math.min(maxCooldown, cooldown + total), 0);
                entity.getOne("Special").update({
                    cooldown: newCooldown
                });
            }

            entity.removeComponent(entity.getOne("ModifySpecialCooldown"));
        });
    }
};

export default SpecialCooldownSystem;
