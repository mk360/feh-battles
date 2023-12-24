import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import getAllies from "../utils/get-allies";
import { Stats } from "../types";
import checkBattleEffectiveness from "./effectiveness";
import getTargetedDefenseStat from "./get-targeted-defense-stat";
import generateTurns from "./generate-turns";
import PreventEnemyAlliesInteraction from "../components/prevent-enemy-allies-interaction";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import SKILLS from "../data/skill-dex";
import getAttackerAdvantage from "./get-attacker-advantage";
import getAffinity from "./get-affinity";

function getCombatStats(entity: Entity) {
    const combatBuffs = entity.getComponents("CombatBuff");
    const combatDebuffs = entity.getComponents("CombatDebuff");
    const mapBuffs = entity.getComponents("MapBuff");
    const mapDebuffs = entity.getComponents("MapDebuff");
    const baseStats = entity.getOne("Stats");

    const compoundStats: Stats = {
        atk: baseStats.atk,
        spd: baseStats.spd,
        def: baseStats.def,
        res: baseStats.res
    };

    combatBuffs.forEach((buff) => {
        for (let stat in compoundStats) {
            compoundStats[stat] += buff[stat];
        }
    });

    combatDebuffs.forEach((debuff) => {
        for (let stat in compoundStats) {
            compoundStats[stat] += debuff[stat];
        }
    });

    mapBuffs.forEach((buff) => {
        for (let stat in compoundStats) {
            compoundStats[stat] += buff[stat];
        }
    });

    mapDebuffs.forEach((debuff) => {
        for (let stat in mapDebuffs) {
            compoundStats[stat] += debuff[stat];
        }
    });

    return compoundStats;
};

class CombatSystem extends System {
    private state: GameState;
    private battlingQuery: Query;

    init(state: GameState) {
        this.state = state;
        this.battlingQuery = this.createQuery().fromAll("Battling");
    }

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
                let affinity = 1;
                if (unit1.getOne("ApplyAffinity") || unit2.getOne("ApplyAffinity")) {
                    affinity = getAffinity(unit1, unit2);
                }

                const damage = Math.floor((Math.floor(atkStat * effectivenessMultiplier) + Math.trunc(Math.floor(atkStat * effectivenessMultiplier) * (advantage * (affinity + 20) / 20)) - defenseStat - flatReduction) * damagePercentage);
                console.log({ damage });
                lastAttacker = turn;
            }
        }
    }

    runAllySkills(ally: Entity) {
        const allies = getAllies(this.state, ally);
        for (let ally of allies) {
            this.state.skillMap.get(ally).onCombatAllyStart?.forEach((skill) => {
                SKILLS[skill.name].onCombatAllyStart.call(skill, this.state, ally);
            });
        }
    }
}

export default CombatSystem;
