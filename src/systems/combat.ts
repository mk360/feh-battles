import { Entity, System } from "ape-ecs";
import SKILLS from "../data/skill-dex";
import SPECIALS from "../data/specials";
import TileBitshifts from "../data/tile-bitshifts";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import { Stats } from "../interfaces/types";
import battlingEntitiesQuery from "./battling-entities-query";
import { calculateDamageBeforeReductions, calculateFinalDamage } from "./calculate-damage";
import checkBattleEffectiveness from "./effectiveness";
import generateTurns from "./generate-turns";
import getAffinity from "./get-affinity";
import getAttackerAdvantage from "./get-attacker-advantage";
import getCombatStats from "./get-combat-stats";
import getPosition from "./get-position";
import getSpecialDecrease from "./get-special-decrease";
import getTargetedDefenseStat from "./get-targeted-defense-stat";
import GameState from "./state";

class CombatSystem extends System {
    private state: GameState;
    private battlingQuery = battlingEntitiesQuery(this);

    init(state: GameState) {
        this.state = state;

        for (let comp of ["DealDamage", "Kill"]) {
            this.subscribe(comp);
        }
    }

    update() {
        const { attacker, defender: target } = this.battlingQuery();

        const combatMap = new Map<Entity, {
            stats: Stats,
            effective: boolean,
            turns: number,
            hp: number,
            consecutiveTurns: number,
            defensiveTile: boolean;
            cooldown: number;
        }>();

        const attackerPosition = getPosition(attacker);
        console.log(attackerPosition.getObject(false));
        const attackerTile = this.state.map[attackerPosition.y][attackerPosition.x];

        combatMap.set(attacker, {
            effective: checkBattleEffectiveness(attacker, target),
            stats: getCombatStats(attacker),
            turns: 0,
            hp: attacker.getOne("Stats").hp,
            consecutiveTurns: 1,
            defensiveTile: Boolean(attackerTile[0] >> TileBitshifts.defensiveTile),
            cooldown: attacker.getOne("Special")?.cooldown
        });

        attacker.addComponent({
            type: "StartingHP",
            value: attacker.getOne("Stats").hp,
        });

        target.addComponent({
            type: "StartingHP",
            value: target.getOne("Stats").hp,
        });

        const defenderPosition = target.getOne("Position");
        const defenderTile = this.state.map[defenderPosition.y][defenderPosition.x];
        combatMap.set(target, {
            effective: checkBattleEffectiveness(target, attacker),
            stats: getCombatStats(target),
            turns: 0,
            hp: target.getOne("Stats").hp,
            consecutiveTurns: 1,
            defensiveTile: Boolean(defenderTile[0] >> TileBitshifts.defensiveTile),
            cooldown: target.getOne("Special")?.cooldown
        });

        const turns = generateTurns(attacker, target, combatMap.get(attacker).stats, combatMap.get(target).stats);

        let lastAttacker: Entity;

        for (let round = 0; round < turns.length; round++) {
            const turn = turns[round];
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
                turnNumber: combatMap.get(turn).turns,
                consecutiveTurnNumber: combatMap.get(turn).consecutiveTurns,
                attackerSpecialCooldown: turn.getOne("Special")?.cooldown || 0,
                defenderSpecialCooldown: defender.getOne("Special")?.cooldown || 0,
            };
            const attackerSkills = this.state.skillMap.get(turn);
            attackerSkills.onCombatRoundAttack?.forEach((skill) => {
                const dexData = SKILLS[skill.name];
                dexData.onCombatRoundAttack.call(skill, defender, turnData);
            });

            const attackerSpecial = turn.getOne("Special");
            if (attackerSpecial) {
                const currentCooldown = combatMap.get(turn).cooldown;
                const attackerSpecialData = SPECIALS[attackerSpecial.name];
                if (currentCooldown === 0 && attackerSpecialData.onCombatRoundAttack) {
                    attackerSkills.onSpecialTrigger?.forEach((skill) => {
                        const dexData = SKILLS[skill.name];
                        dexData.onSpecialTrigger.call(skill, turn, turnData);
                    });
                    attackerSpecialData.onCombatRoundAttack?.call(attackerSpecial, defender);
                    turnData.attackerTriggeredSpecial = true;
                    if (turn.getOne("Battling")) {
                        attackerSpecial.update({
                            cooldown: attackerSpecial.maxCooldown
                        });
                    }
                    combatMap.get(turn).cooldown = attackerSpecial.maxCooldown;
                } else {
                    const decrease = getSpecialDecrease(turn);
                    combatMap.get(turn).cooldown = Math.max(0, currentCooldown - decrease);
                    turnData.attackerSpecialCooldown = combatMap.get(turn).cooldown;
                    if (turn.getOne("Battling")) {
                        turn.getOne("Special").update({
                            cooldown: combatMap.get(turn).cooldown
                        });
                    }
                }
            }

            let flatExtraDamage = 0;
            let damageIncreasePercentage = 0;
            const percentageIncreases = Array.from(attacker.getComponents("DamageIncrease")).concat(Array.from(attacker.getComponents("RoundDamageIncrease"))).filter((i) => !!i.percentage);

            if (percentageIncreases.length) {
                damageIncreasePercentage = 100;
            }

            attacker.getComponents("DamageIncrease").forEach((damageIncrease) => {
                if (damageIncrease.amount) {
                    flatExtraDamage += damageIncrease.amount;
                    // if (attacker.getOne(""))
                }
                if (damageIncrease.percentage) {
                    damageIncreasePercentage *= damageIncrease.percentage / 100;
                }
            });

            attacker.getComponents("RoundDamageIncrease").forEach((damageIncrease) => {
                if (damageIncrease.amount) {
                    flatExtraDamage += damageIncrease.amount;
                }
                if (damageIncrease.percentage) {
                    damageIncreasePercentage *= damageIncrease.percentage / 100;
                }
                attacker.removeComponent(damageIncrease);
            });

            const defenderSkills = this.state.skillMap.get(defender);
            defenderSkills.onCombatRoundDefense?.forEach((skill) => {
                const dexData = SKILLS[skill.name];
                dexData.onCombatRoundDefense.call(skill, turn, turnData);
            });

            const defenderStats = combatMap.get(defender).stats;
            const defenseStat = defenderStats[getTargetedDefenseStat(turn, defender, defenderStats)];
            const effectivenessMultiplier = combatMap.get(turn).effective ? 1.5 : 1;
            const atkStat = combatMap.get(turn).stats.atk;
            const damageReductionComponents = defender.getComponents("DamageReduction");
            const roundDamageReductions = defender.getComponents("RoundDamageReduction");
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

            roundDamageReductions.forEach((comp) => {
                if (comp.percentage) {
                    damagePercentage *= (100 - comp.percentage) / 100;
                }
                if (comp.amount) {
                    flatReduction += comp.amount;
                }
                defender.removeComponent(comp);
            });

            const advantage = getAttackerAdvantage(turn, defender);
            let affinity = 0;
            if (attacker.getOne("ApplyAffinity") || target.getOne("ApplyAffinity")) {
                affinity = getAffinity(turn, defender);
            }

            const damageBeforeReduction = calculateDamageBeforeReductions({
                advantage,
                affinity,
                atkStat,
                effectiveness: effectivenessMultiplier,
                defenseStat,
                defensiveTerrain: combatMap.get(defender).defensiveTile,
                specialIncreasePercentage: damageIncreasePercentage,
                flatIncrease: flatExtraDamage,
                staffPenalty: turn.getOne("Weapon").weaponType === "staff" && !turn.getOne("NormalizeStaffDamage")
            });

            const defenderSpecial = defender.getOne("Special");
            if (defenderSpecial && combatMap.get(defender).cooldown === 0) {
                const defenderSpecialData = SPECIALS[defenderSpecial.name];
                const shouldTrigger = defenderSpecialData.shouldActivate?.call(defenderSpecial, damageBeforeReduction) ?? true;
                if (defenderSpecialData.onCombatRoundDefense && shouldTrigger) {
                    defenderSkills.onSpecialTrigger?.forEach((skill) => {
                        const dexData = SKILLS[skill.name];
                        dexData.onSpecialTrigger.call(skill, defender, turnData);
                    });
                    defenderSpecialData.onCombatRoundDefense?.call(defenderSpecial, defender);
                    turnData.defenderTriggeredSpecial = true;
                    defenderSpecial.update({
                        cooldown: defenderSpecial.maxCooldown
                    });
                }
            }

            if (defender.getOne("Special")) {
                const decrease = getSpecialDecrease(defender);
                const currentCooldown = combatMap.get(defender).cooldown;
                combatMap.get(defender).cooldown = Math.max(0, currentCooldown - decrease);
                turnData.defenderSpecialCooldown = combatMap.get(defender).cooldown;
                if (defender.getOne("Battling")) {
                    defender.getOne("Special").update({
                        cooldown: combatMap.get(defender).cooldown
                    });
                }
            }

            const damageAfterReduction = calculateFinalDamage({
                netDamage: damageBeforeReduction,
                flatReduction: 0,
                damagePercentage
            });

            if (defender.getOne("ForceSurvival") && !defender.getOne("ForcedSurvival") && damageAfterReduction >= combatMap.get(defender).hp) {
                defender.removeComponent(defender.getOne("ForceSurvival"));
                defender.addComponent({
                    type: "ForcedSurvival"
                });
                combatMap.get(defender).hp = 1;
            } else {
                combatMap.get(defender).hp -= damageAfterReduction;
            }

            const heal = turn.getOne("CombatHeal");
            const maxHP = turn.getOne("Stats").maxHP;
            let healingAmount = 0;

            if (heal) {
                if (heal.amount) {
                    healingAmount += heal.amount;
                    combatMap.get(turn).hp = Math.min(maxHP, combatMap.get(turn).hp + heal.amount);
                } else {
                    healingAmount += damageAfterReduction * heal.percentage / 100;
                }
                turn.removeComponent(heal);
            }

            const defenderHeal = defender.getOne("CombatHeal");
            const defenderMaxHP = defender.getOne("Stats").maxHP;
            let defenderHealingAmount = 0;

            if (defenderHeal) {
                defenderHealingAmount += heal.value;
                combatMap.get(turn).hp = Math.min(defenderMaxHP, combatMap.get(defender).hp + heal.amount);
                defender.removeComponent(heal);
            }

            turn.addComponent({
                type: "DealDamage",
                round,
                attacker: {
                    hp: combatMap.get(turn).hp,
                    entity: turn,
                    damage: damageAfterReduction,
                    heal: Math.floor(healingAmount),
                    triggerSpecial: !!turnData.attackerTriggeredSpecial,
                    specialCooldown: turnData.attackerSpecialCooldown,
                    turn: turnData.consecutiveTurnNumber,
                },
                target: {
                    hp: combatMap.get(defender).hp,
                    entity: defender,
                    damage: 0,
                    heal: Math.floor(defenderHealingAmount),
                    triggerSpecial: !!turnData.defenderTriggeredSpecial,
                    specialCooldown: turnData.defenderSpecialCooldown,
                    turn: 0
                },
            });

            if (turn.getOne("Battling") && defender.getOne("Battling")) {
                const defenderStatsComponent = defender.getOne("Stats");
                defenderStatsComponent.update({
                    hp: Math.max(combatMap.get(defender).hp, 0)
                });
            }

            if (combatMap.get(defender).hp <= 0) {
                defender.addComponent({
                    type: "Kill"
                });
                break;
            }
            lastAttacker = turn;
        }
    }
}

export default CombatSystem;
