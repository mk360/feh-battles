import { System } from "ape-ecs";
import battlingEntitiesQuery from "./battling-entities-query";
import GameState from "./state";
import SPECIALS from "../data/specials";
import collectMapMods from "./collect-map-mods";
import { CombatStats } from "../interfaces/types";

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
        this.world.runSystems("aoe");

        const { attacker, defender } = this.battlingQuery();

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

        if (attacker.getOne("NeutralizeMapBuffs")) {
            const defenderMapMods = collectMapMods(defender);
            const debuffMap: Partial<CombatStats> = {};

            for (let stat in defenderMapMods.buffs) {
                const value = defenderMapMods.buffs[stat];
                debuffMap[stat] = -value;
            }

            defender.addComponent({
                type: "CombatDebuff",
                ...debuffMap
            });
        }

        if (defender.getOne("NeutralizeMapBuffs")) {
            const attackerMapMods = collectMapMods(attacker);
            const debuffMap: Partial<CombatStats> = {};

            for (let stat in attackerMapMods.buffs) {
                const value = attackerMapMods.buffs[stat];
                debuffMap[stat] = -value;
            }

            attacker.addComponent({
                type: "CombatDebuff",
                ...debuffMap
            });
        }
    }
};

export default BeforeCombat;
