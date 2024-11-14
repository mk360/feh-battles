import { Entity, System } from "ape-ecs";
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
import { calculateDamageBeforeReductions, calculateFinalDamage } from "./calculate-damage";
import TileBitshifts from "../data/tile-bitshifts";
import SPECIALS from "../data/specials";
import getPosition from "./get-position";
import battlingEntitiesQuery from "./battling-entities-query";
import getSpecialDecrease from "./get-special-decrease";
import COMBAT_COMPONENTS from "./combat-components";


class CombatSystem extends System {
    private state: GameState;
    private battlingQuery = battlingEntitiesQuery(this);

    init(state: GameState) {
        this.state = state;

        for (let comp of COMBAT_COMPONENTS.concat(["DealDamage", "Kill"])) {
            this.subscribe(comp);
        }
    }

    update() {
        const { attacker, defender: target } = this.battlingQuery();

        if (!target.getOne(PreventEnemyAlliesInteraction)) {
            this.runAllySkills(attacker);
        }

        if (!attacker.getOne(PreventEnemyAlliesInteraction)) {
            this.runAllySkills(target);
        }

        const attackerSkills = this.state.skillMap.get(attacker);
        const defenderSkills = this.state.skillMap.get(target);

        attackerSkills.onCombatStart?.forEach((skill) => {
            SKILLS[skill.name].onCombatStart.call(skill, this.state, target);
        });

        attackerSkills.onCombatInitiate?.forEach((skill) => {
            SKILLS[skill.name].onCombatInitiate.call(skill, this.state, target);
        });

        defenderSkills.onCombatStart?.forEach((skill) => {
            SKILLS[skill.name].onCombatStart.call(skill, this.state, attacker);
        });

        defenderSkills.onCombatDefense?.forEach((skill) => {
            SKILLS[skill.name].onCombatDefense.call(skill, this.state, attacker);
        });

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
                consecutiveTurnNumber: combatMap.get(turn).consecutiveTurns,
                attackerSpecialCooldown: turn.getOne("Special")?.cooldown || 0,
                defenderSpecialCooldown: defender.getOne("Special")?.cooldown || 0,
            };
            const attackerSkills = this.state.skillMap.get(turn);
            attackerSkills.onCombatRoundAttack?.forEach((skill) => {
                const dexData = SKILLS[skill.name];
                dexData.onCombatRoundAttack.call(skill, turn, turnData);
            });

            const attackerSpecial = turn.getOne("Special");
            if (attackerSpecial && combatMap.get(turn).cooldown === 0) {
                const attackerSpecialData = SPECIALS[attackerSpecial.name];
                if (attackerSpecialData.onCombatRoundAttack) {
                    attackerSkills.onSpecialTrigger?.forEach((skill) => {
                        const dexData = SKILLS[skill.name];
                        dexData.onSpecialTrigger.call(skill, turn, turnData);
                        attackerSpecial.update({
                            cooldown: attackerSpecial.maxCooldown
                        });
                    });
                    attackerSpecialData.onCombatRoundAttack?.call(attackerSpecial, defender);
                    turnData.attackerTriggeredSpecial = true;
                    attackerSpecial.update({
                        cooldown: attackerSpecial.maxCooldown
                    });
                }
            }

            let flatExtraDamage = 0;
            let damageIncreasePercentage = 100;
            attacker.getComponents("DamageIncrease").forEach((damageIncrease) => {
                flatExtraDamage += damageIncrease.value;
            });
            attacker.getComponents("RoundDamageIncrease").forEach((damageIncrease) => {
                if (damageIncrease.value) {
                    flatExtraDamage += damageIncrease.value;
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
                specialIncreasePercentage: 0,
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

            if (turn.getOne("Special")) {
                const decrease = getSpecialDecrease(turn);
                const currentCooldown = combatMap.get(turn).cooldown;
                combatMap.get(turn).cooldown = Math.max(0, currentCooldown - decrease);
                turnData.attackerSpecialCooldown = combatMap.get(turn).cooldown;
            }

            if (defender.getOne("Special")) {
                const decrease = getSpecialDecrease(defender);
                const currentCooldown = combatMap.get(defender).cooldown;
                combatMap.get(defender).cooldown = Math.max(0, currentCooldown - decrease);
                turnData.defenderSpecialCooldown = combatMap.get(defender).cooldown;
            }

            const damageAfterReduction = calculateFinalDamage({
                netDamage: damageBeforeReduction,
                flatReduction: flatExtraDamage,
                damagePercentage
            });

            if (defender.getOne("ForceSurvival") && damageAfterReduction >= combatMap.get(defender).hp) {
                defender.removeComponent(defender.getOne("ForceSurvival"));
                combatMap.get(defender).hp = 1;
            } else {
                combatMap.get(defender).hp -= damageAfterReduction;
            }

            const heal = turn.getOne("CombatHeal");
            const maxHP = turn.getOne("Stats").maxHP;
            let healingAmount = 0;

            if (heal) {
                healingAmount += heal.value;
                combatMap.get(turn).hp = Math.min(maxHP, combatMap.get(turn).hp + heal.value);
                turn.removeComponent(heal);
            }

            const defenderHeal = defender.getOne("CombatHeal");
            const defenderMaxHP = defender.getOne("Stats").maxHP;
            let defenderHealingAmount = 0;

            if (defenderHeal) {
                defenderHealingAmount += heal.value;
                combatMap.get(turn).hp = Math.min(defenderMaxHP, combatMap.get(defender).hp + heal.value);
                defender.removeComponent(heal);
            }

            turn.addComponent({
                type: "DealDamage",
                round,
                attacker: {
                    hp: Math.min(combatMap.get(turn).hp + healingAmount, turn.getOne("Stats").maxHP),
                    entity: turn,
                    damage: damageAfterReduction,
                    heal: healingAmount,
                    triggerSpecial: !!turnData.attackerTriggeredSpecial,
                    specialCooldown: turnData.attackerSpecialCooldown,
                    turn: turnData.consecutiveTurnNumber,
                },
                target: {
                    hp: Math.min(Math.max(combatMap.get(target).hp + defenderHealingAmount, 0), defender.getOne("Stats").maxHP),
                    entity: defender,
                    damage: 0,
                    heal: defenderHealingAmount,
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

    runAllySkills(entity: Entity) {
        const allies = getAllies(this.state, entity);
        for (let ally of allies) {
            this.state.skillMap.get(ally).onCombatAllyStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatAllyStart.call(skill, this.state, entity);
            });
        }
    }
}

export default CombatSystem;
