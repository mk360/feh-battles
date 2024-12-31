import { System } from "ape-ecs";
import GameState from "./state";
import battlingEntitiesQuery from "./battling-entities-query";
import SKILLS from "../data/skill-dex";
import COMBAT_COMPONENTS from "./combat-components";

class AfterCombatSystem extends System {
    private state: GameState;
    private query = battlingEntitiesQuery(this);

    init(state: GameState) {
        this.state = state;
        this.subscribe("AoEDamage");
        this.subscribe("Heal");
        this.subscribe("MapBuff");
        this.subscribe("MapDebuff");
        this.subscribe("Status");
    }

    update() {
        const { attacker, defender } = this.query();

        const tiles = COMBAT_COMPONENTS.concat(["AttackTile", "MovementTile", "TargetableTile", "StartingHP"]);
        this.state.skillMap.get(attacker).onCombatAfter?.forEach((skill) => {
            const skillData = SKILLS[skill.name];
            skillData.onCombatAfter.call(skill, this.state, defender);
        });


        for (let component of tiles) {
            attacker.getComponents(component).forEach(comp => { if (comp) attacker.removeComponent(comp); });
        }

        this.state.skillMap.get(defender).onCombatAfter?.forEach((skill) => {
            const skillData = SKILLS[skill.name];
            skillData.onCombatAfter.call(skill, this.state, attacker);
        });

        for (let component of tiles) {
            defender.getComponents(component).forEach(comp => { if (comp) defender.removeComponent(comp); });
        }

        this.world.runSystems("hp-mod");
    }
}

export default AfterCombatSystem;
