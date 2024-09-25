import { System } from "ape-ecs";
import battlingEntitiesQuery from "./battling-entities-query";
import GameState from "./state";
import SPECIALS from "../data/specials";

const STATUS_COMPONENTS = ["SlowSpecial", "AccelerateSpecial", "PreventCounterattack", "GuaranteedFollowup", "MapDamage", "Heal", "Special"];

class BeforeCombat extends System {
    private state: GameState;
    private battlingQuery = battlingEntitiesQuery(this);

    init(state: GameState) {
        this.state = state;

        for (let comp of STATUS_COMPONENTS) {
            this.subscribe(comp);
        }
    }

    update() {
        const { attacker, defender } = this.battlingQuery();

        if (attacker.getOne("Special")) {
            const equippedSpecial = attacker.getOne("Special");
            const specialData = SPECIALS[equippedSpecial.name];

            if (specialData.type === "aoe" && equippedSpecial.cooldown === 0) {
                const targets = specialData.getAoETargets.call(equippedSpecial, this.state, defender);

                targets.forEach((target) => {
                    const damage = specialData.getAoEDamage.call(equippedSpecial, this.state, target);

                    if (damage) {
                        target.addComponent({
                            type: "MapDamage",
                            value: damage
                        });
                    }
                });

                equippedSpecial.update({
                    cooldown: equippedSpecial.maxCooldown
                });
            }
        }

        if (attacker.tags.has("Guard")) {
            attacker.addComponent({
                type: "SlowSpecial"
            });
        }

        if (defender.tags.has("Guard")) {
            defender.addComponent({
                type: "SlowSpecial"
            });
        }

        if (defender.tags.has("Prevent Counterattack")) {
            attacker.addComponent({
                type: "PreventCounterattack"
            });
        }
    }
};

export default BeforeCombat;
