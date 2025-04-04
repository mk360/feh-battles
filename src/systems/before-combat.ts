import { Entity, System } from "ape-ecs";
import battlingEntitiesQuery from "./battling-entities-query";
import GameState from "./state";
import collectMapMods from "./collect-map-mods";
import { CombatStats } from "../interfaces/types";
import SKILLS from "../data/skill-dex";
import PreventEnemyAlliesInteraction from "../components/prevent-enemy-allies-interaction";
import getAllies from "../utils/get-allies";
import COMBAT_COMPONENTS from "./combat-components";

const STATUS_COMPONENTS = COMBAT_COMPONENTS.concat(["SlowSpecial", "AccelerateSpecial", "AoEDamage", "AoETarget", "PreventCounterattack", "GuaranteedFollowup", "AoEDamage", "Heal", "Special"]);

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
        this.world.runSystems("hp-mod");

        const { attacker, defender } = this.battlingQuery();

        const attackerSkills = this.state.skillMap.get(attacker);
        const defenderSkills = this.state.skillMap.get(defender);

        attackerSkills.onCombatStart?.forEach((skill) => {
            SKILLS[skill.name].onCombatStart.call(skill, this.state, defender);
        });

        defenderSkills.onCombatStart?.forEach((skill) => {
            SKILLS[skill.name].onCombatStart.call(skill, this.state, attacker);
        });

        attackerSkills.onCombatInitiate?.forEach((skill) => {
            SKILLS[skill.name].onCombatInitiate.call(skill, this.state, defender);
        });

        defenderSkills.onCombatDefense?.forEach((skill) => {
            SKILLS[skill.name].onCombatDefense.call(skill, this.state, attacker);
        });

        if (!defender.getOne(PreventEnemyAlliesInteraction)) {
            this.runAllySkills(attacker);
        }

        if (!attacker.getOne(PreventEnemyAlliesInteraction)) {
            this.runAllySkills(defender);
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

    runAllySkills(entity: Entity) {
        const allies = getAllies(this.state, entity);
        for (let ally of allies) {
            this.state.skillMap.get(ally).onCombatAllyStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatAllyStart.call(skill, this.state, entity);
            });
        }
    }
};

export default BeforeCombat;
