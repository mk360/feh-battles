import { System } from "ape-ecs";
import GameState from "../state";
import battlingEntitiesQuery from "../battling-entities-query";
import SPECIALS from "../../data/specials";

class AoESystem extends System {
    private query = battlingEntitiesQuery(this);
    private state: GameState;

    init(state: GameState): void {
        this.state = state;
        this.subscribe("AoETarget");
    }

    update(): void {
        const { attacker, defender } = this.query();

        const special = attacker.getOne("Special");

        if (special?.cooldown === 0) {
            const specialData = SPECIALS[special.name];
            if (specialData.type === "aoe") {
                const targets = specialData.getAoETargets(this.state, defender);
                targets.forEach((target) => {
                    const damage = specialData.getAoEDamage(special, this.state, target);
                    if (attacker.getOne("Battling")) {
                        target.addComponent({
                            type: "MapDamage",
                            value: damage
                        });
                    } else {
                        target.addComponent({
                            type: "AoETarget",
                            value: damage
                        });
                    }
                });

                if (attacker.getOne("Battling")) {
                    special.update({
                        cooldown: special.maxCooldown
                    });
                }
            }
        }
    }
};

export default AoESystem;
