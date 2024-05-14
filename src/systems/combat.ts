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
import collectCombatMods from "./collect-combat-mods";

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
        const [attacker, target] = this.battlingQuery.execute();
        if (attacker && target) {
            if (!target.getOne(PreventEnemyAlliesInteraction)) {
                this.runAllySkills(attacker);
            }

            if (!attacker.getOne(PreventEnemyAlliesInteraction)) {
                this.runAllySkills(target);
            }

            const attackerSkills = this.state.skillMap.get(attacker);
            const defenderSkills = this.state.skillMap.get(target);
            attackerSkills?.onCombatStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatStart.call(skill, this.state, target);
            });

            attackerSkills?.onCombatInitiate?.forEach((skill) => {
                SKILLS[skill.name].onCombatInitiate.call(skill, this.state, target);
            });

            defenderSkills?.onCombatStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatStart.call(skill, this.state, attacker);
            });

            defenderSkills?.onCombatDefense?.forEach((skill) => {
                SKILLS[skill.name].onCombatDefense.call(skill, this.state, attacker);
            });

            const combatMap = new Map<Entity, {
                stats: Stats,
                effective: boolean,
                turns: number,
                hp: number,
                consecutiveTurns: number,
            }>();
            combatMap.set(attacker, {
                effective: checkBattleEffectiveness(attacker, target),
                stats: getCombatStats(attacker),
                turns: 0,
                hp: attacker.getOne("Stats").hp,
                consecutiveTurns: 1,
            });
            combatMap.set(target, {
                effective: checkBattleEffectiveness(target, attacker),
                stats: getCombatStats(target),
                turns: 0,
                hp: target.getOne("Stats").hp,
                consecutiveTurns: 1
            });
            const turns = generateTurns(attacker, target, combatMap.get(attacker).stats, combatMap.get(target).stats);

            let lastAttacker: Entity;
            for (let i = 0; i < turns.length; i++) {
                const turn = turns[i];
                const defender = turn === attacker ? target : attacker;
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
                    dexData.onCombatRoundAttack.call(skill, turn, turnData);
                    if (skill.slot === "special") {
                        turnData.attackerTriggeredSpecial = true;
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

                const advantage = getAttackerAdvantage(attacker, target);
                let affinity = 0;
                if (attacker.getOne("ApplyAffinity") || target.getOne("ApplyAffinity")) {
                    affinity = getAffinity(attacker, target);
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

                combatMap.get(defender).hp -= damage;
                if (combatMap.get(defender).hp <= 0) {
                    break;
                }
                lastAttacker = turn;
            }
        }
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
