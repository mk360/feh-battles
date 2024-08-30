import { Query, System } from "ape-ecs";
import GameState from "./state";
import battlingEntitiesQuery from "./battling-entities-query";
import SKILLS from "../data/skill-dex";

const subscribedComponents = ["MapBuff", "MapDebuff", "Status"];

class AfterCombatSystem extends System {
    private state: GameState;
    private query: ReturnType<typeof battlingEntitiesQuery>;

    init(state: GameState): void {
        this.state = state;
        this.query = battlingEntitiesQuery(this);
        for (let comp of subscribedComponents) {
            this.subscribe(comp);
        }
    }

    update() {
        const { attacker, defender } = this.query();
        attacker.getComponents("CombatBuff").forEach(comp => attacker.removeComponent(comp));
        defender.getComponents("CombatBuff").forEach(comp => attacker.removeComponent(comp));

        this.state.skillMap.get(attacker).onCombatAfter.forEach((skill) => {
            const skillData = SKILLS[skill.name];
            skillData.onCombatAfter?.call(skill, this.state, defender);
        });

        this.state.skillMap.get(defender).onCombatAfter.forEach((skill) => {
            const skillData = SKILLS[skill.name];
            skillData.onCombatAfter?.call(skill, this.state, attacker);
        });
    }
}

export default AfterCombatSystem;
