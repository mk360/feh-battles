import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import getAllies from "../utils/get-alies";
import PASSIVES from "../data/passives";
import { Stats } from "../types";
import checkBattleEffectiveness from "./effectiveness";
import getTargetedDefenseStat from "./get-targeted-defense-stat";
import generateTurns from "./generate-turns";

interface CombatTurnOutcome {
    turnNumber: number;
    consecutiveTurnNumber: number;
    attacker: Entity;
    defender: Entity;
    damage: number;
    attackerSpecialCooldown: number;
    defenderSpecialCooldown: number;
}

interface CombatOutcome {
    attacker: {
        id: string;
        turnCount: number;
        effectiveness: boolean;
        damageByTurn: number;
        hp: number;
    };
    defender: {
        id: string;
        turnCount: number;
        effectiveness: boolean;
        damageByTurn: number;
        hp: number;
    };
    turns: CombatTurnOutcome[];
}

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
            this.runAllySkills(unit1);
            this.runAllySkills(unit2);
            const combatMap = new Map<Entity, {
                stats: Stats,
                effective: boolean
            }>();
            combatMap.set(unit1, {
                effective: checkBattleEffectiveness(unit1, unit2),
                stats: getCombatStats(unit1)
            });
            combatMap.set(unit2, {
                effective: checkBattleEffectiveness(unit2, unit1),
                stats: getCombatStats(unit2)
            });
            const turns = generateTurns(unit1, unit2, combatMap.get(unit1).stats, combatMap.get(unit2).stats);

            for (let turn of turns) {
                const defender = turn === unit1 ? unit2 : unit1;
                const defenderStats = combatMap.get(defender).stats;
                const defenseStat = defenderStats[getTargetedDefenseStat(turn, defender, defenderStats)];
                const effectivenessMultiplier = combatMap.get(defender).effective ? 1.5 : 1;
                const atkStat = combatMap.get(turn).stats.atk;
                const damage = Math.max(0, Math.floor((atkStat - defenseStat) * effectivenessMultiplier));
                console.log({ damage });
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
