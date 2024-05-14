import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import getAllies from "../utils/get-allies";
import { Stats } from "../interfaces/types";
import checkBattleEffectiveness from "./effectiveness";
import getTargetedDefenseStat from "./get-targeted-defense-stat";
import generateTurns from "./generate-turns";
import PreventEnemyAlliesInteraction from "../components/prevent-enemy-allies-interaction";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import SKILLS from "../data/skill-dex";
import getAttackerAdvantage from "./get-attacker-advantage";
import getAffinity from "./get-affinity";
import getCombatStats from "./get-combat-stats";
import calculateDamage from "./calculate-damage";

class CombatSystem extends System {
    private state: GameState;
    private battlingQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.subscribe("DealDamage");
        this.subscribe("CombatBuff");
        this.subscribe("CombatDebuff");

        this.battlingQuery = this.createQuery().fromAll("Battling");
    }

    // Ike vs. Corrin
    // Round 1: Ike attaque, Corrin défend
    // Round 2: Corrin attaque, Ike défend
    // Round 3 ou 4 ou 5, bis repetita en alternant

    update() {
        const [unit1, unit2] = this.battlingQuery.execute();
        if (unit1 && unit2) {
            if (!unit2.getOne(PreventEnemyAlliesInteraction)) {
                this.runAllySkills(unit1);
            }

            if (!unit1.getOne(PreventEnemyAlliesInteraction)) {
                this.runAllySkills(unit2);
            }

            const attackerSkills = this.state.skillMap.get(unit1);
            const defenderSkills = this.state.skillMap.get(unit2);
            attackerSkills?.onCombatStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatStart.call(skill, this.state, unit2);
            });

            attackerSkills?.onCombatInitiate?.forEach((skill) => {
                SKILLS[skill.name].onCombatInitiate.call(skill, this.state, unit2);
            });

            defenderSkills?.onCombatStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatStart.call(skill, this.state, unit1);
            });

            defenderSkills?.onCombatDefense?.forEach((skill) => {
                SKILLS[skill.name].onCombatDefense.call(skill, this.state, unit1);
            });

            const combatMap = new Map<Entity, {
                stats: Stats,
                effective: boolean,
                turns: number,
                consecutiveTurns: number,
            }>();
            combatMap.set(unit1, {
                effective: checkBattleEffectiveness(unit1, unit2),
                stats: getCombatStats(unit1),
                turns: 0,
                consecutiveTurns: 1,
            });
            combatMap.set(unit2, {
                effective: checkBattleEffectiveness(unit2, unit1),
                stats: getCombatStats(unit2),
                turns: 0,
                consecutiveTurns: 1
            });
            const turns = generateTurns(unit1, unit2, combatMap.get(unit1).stats, combatMap.get(unit2).stats);

            let lastAttacker: Entity;
            for (let i = 0; i < turns.length; i++) {
                const turn = turns[i];
                const defender = turn === unit1 ? unit2 : unit1;
                if (lastAttacker === turn) {
                    combatMap.get(turn).consecutiveTurns++;
                } else {
                    combatMap.get(defender).consecutiveTurns = 0;
                }
                combatMap.get(turn).turns++;
                const turnData: Partial<CombatTurnOutcome> = {
                    attacker: turn,
                    defender,
                    consecutiveTurnNumber: combatMap.get(turn).consecutiveTurns,
                };
                const attackerSkills = this.state.skillMap.get(turn);
                attackerSkills?.onCombatRoundAttack?.forEach((skill) => {
                    const dexData = SKILLS[skill.name];
                    dexData.onCombatRoundDefense.call(skill, turn, turnData);
                    if (skill.slot === "special") {
                        turnData.defenderTriggeredSpecial = true;
                    }
                });
                const defenderSkills = this.state.skillMap.get(defender);
                defenderSkills?.onCombatRoundDefense?.forEach((skill) => {
                    const dexData = SKILLS[skill.name];
                    dexData.onCombatRoundDefense.call(skill, turn, turnData);
                    if (skill.slot === "special") {
                        turnData.defenderTriggeredSpecial = true;
                    }
                });
                const defenderStats = combatMap.get(defender).stats;
                const defenseStat = defenderStats[getTargetedDefenseStat(turn, defender, defenderStats)];
                const effectivenessMultiplier = combatMap.get(defender).effective ? 1.5 : 1;
                const atkStat = combatMap.get(turn).stats.atk;
                const damageReductionComponents = defender.getComponents("DamageReduction");
                let flatReduction = 0;
                let damagePercentage = 100;
                damageReductionComponents.forEach((comp) => {
                    if (comp.percentage) {
                        damagePercentage *= (1 - comp.percentage);
                    }
                    if (comp.amount) {
                        flatReduction += comp.amount;
                    }
                });

                const advantage = getAttackerAdvantage(unit1, unit2);
                let affinity = 0;
                if (unit1.getOne("ApplyAffinity") || unit2.getOne("ApplyAffinity")) {
                    affinity = getAffinity(unit1, unit2);
                }

                const damage = calculateDamage({
                    advantage,
                    affinity,
                    atkStat,
                    effectiveness: effectivenessMultiplier,
                    defenseStat,
                    defensiveTerrain: false,
                    flatReduction,
                    damagePercentage
                })

                turn.addComponent({
                    type: "DealDamage",
                    target: defender,
                    damage: damage,
                    turnIndex: i,
                });
                lastAttacker = turn;
            }
        }

        console.log(this.world.getEntities("DealDamage"));
    }

    runAllySkills(ally: Entity) {
        const allies = getAllies(this.state, ally);
        for (let ally of allies) {
            this.state.skillMap.get(ally)?.onCombatAllyStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatAllyStart.call(skill, this.state, ally);
            });
        }
    }
}

export default CombatSystem;
