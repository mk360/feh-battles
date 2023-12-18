import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import getAllies from "../utils/get-alies";
import PASSIVES from "../data/passives";
import { Stats } from "../types";
import checkBattleEffectiveness from "./effectiveness";
import getTargetedDefenseStat from "./get-targeted-defense-stat";
import generateTurns from "./generate-turns";
import PreventEnemyAlliesInteraction from "../components/prevent-enemy-allies-interaction";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";

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

            const attackerSkills = unit1.getComponents("Skill");
            const defenderSkills = unit2.getComponents("Skill");

            attackerSkills.forEach((skill) => {
                const skillData = PASSIVES[skill.name];
                if (skillData?.onCombatStart) {
                    skillData.onCombatStart.call(skill, this.state, unit2);
                }
            })

            defenderSkills.forEach((skill) => {
                const skillData = PASSIVES[skill.name];
                if (skillData?.onCombatStart) {
                    skillData.onCombatStart.call(skill, this.state, unit1)
                }
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
                defender.getComponents("Skill").forEach((skill) => {
                    const dexData = PASSIVES[skill.name];
                    if (dexData && dexData.onCombatRoundDefense) {
                        dexData.onCombatRoundDefense.call(skill, turn, turnData);
                        if (skill.slot === "special") {
                            turnData.defenderTriggeredSpecial = true;
                        }
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
                const damage = Math.floor(Math.max(0, (atkStat - defenseStat) * effectivenessMultiplier) * damagePercentage / 100) - flatReduction;
                lastAttacker = turn;
            }
        }
    }

    runAllySkills(hero: Entity) {
        const allies = getAllies(this.state, hero);
        for (let ally of allies) {
            ally.getComponents("Skill").forEach((skill) => {
                if (PASSIVES[skill.name].onCombatAllyStart) {
                    PASSIVES[skill.name].onCombatAllyStart.call(skill, this.state, hero);
                }
            });
        }
    }
}

export default CombatSystem;
