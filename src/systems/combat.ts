import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import getAllies from "../utils/get-alies";
import PASSIVES from "../data/passives";
import { Stats } from "../types";
import checkBattleEffectiveness from "./effectiveness";
import getDefenseStat from "./get-defense-stat";
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
            const firstHeroStats = getCombatStats(unit1);
            const secondHeroStats = getCombatStats(unit2);
            const turns = generateTurns(unit1, unit2, firstHeroStats, secondHeroStats);
            const effectiveness = checkBattleEffectiveness(unit1, unit2);
            const defenseStat = secondHeroStats[getDefenseStat(unit1)];
            const effectivenessMultiplier = effectiveness ? 1.5 : 1;
            const damage = Math.floor((firstHeroStats.atk - defenseStat) * effectivenessMultiplier);

            // console.log({ damage });
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
