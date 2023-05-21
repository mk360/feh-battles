import Hero from "./hero";
import Skill from "./passive_skill";
import { StatsBuffsTable } from "./types";
import { WeaponColor as WeaponColor } from "./weapon";
import cloneDeep from "lodash.clonedeep";

export interface Combat {
    attacker: Hero,
    defender: Hero
};

interface Sides {
    attacker: Hero,
    defender: Hero
}

interface DamageFormula {
    attackStat: number,
    defenderStat: number,
    effectiveness: number,
    affinity: number,
    advantage: number
}

interface TurnOutcome {
    attacker: Hero,
    defender: Hero,
    advantage: "advantage" | "disadvantage" | "neutral",
    effective: boolean,
    remainingHP: number,
    damage: number
}

interface CombatOutcome {
    // attacker: {
    //     turns: number;
    //     damageByTurn: number;
    //     extraDamage: number;
    // };
    // defender: {
    //     turns: number;
    //     damageByTurn: number;
    //     extraDamage: number;
    // };
    atkChanges: StatsBuffsTable
    defChanges: StatsBuffsTable
    atkRemainingHP: number
    defRemainingHP: number
    atkDamage: number
    defDamage: number
    atkEffective: boolean;
    defEffective: boolean;
    outcome: TurnOutcome[]
}

function getColorRelationship(attackerColor: WeaponColor, defenderColor: WeaponColor): number {
    if (attackerColor === defenderColor || [attackerColor, defenderColor].includes("colorless")) return 0;
    return {
        blue: {
            red: 0.2,
            green: -0.2
        },
        red: {
            blue: -0.2,
            green: 0.2
        },
        green: {
            red: -0.2,
            blue: 0.2,
        },
    }[attackerColor][defenderColor];
};

type hookNames = "onEquip" | "onInitiate" | "onDefense" | "onBeforeCombat" | "onStartTurn" | "onAllyInitiate" | "onAllyDefense" | "onBeforeAllyCombat" | "modifyCursors";
type hookSide = "defender" | "attacker";

interface SkillHook {
    skill: Skill,
    hookName: hookNames
    side?: hookSide
}

interface AffinityArguments {
    predicate: ({ attacker, defender }: Sides) => number,
    attacker?: Hero,
    defender?: Hero
}

interface previousTurns {
    heroId: string,
    turns: Turn[]
}

interface Turn {
    attacker: Hero,
    defender: Hero,
    damage?: number,
    effective?: boolean
    order?: number
};

interface TurnArgument {
    attacker: Hero,
    defender: Hero,
    turns: Turn[],
    iterations: number
}

export class Combat {
    constructor({ attacker, defender }: { attacker: Hero, defender: Hero }) {
        this.attacker = this.cloneHero(attacker);
        this.defender = this.cloneHero(defender);
    };

    cloneHero(hero: Hero) {
        const clone = cloneDeep(hero) as Hero;
        clone.allies = hero.allies;
        clone.enemies = hero.enemies;
        return clone;
    }
    private callAttackerHook(hook: SkillHook) {
        this.callSkillHook({ hookName: hook.hookName, skill: hook.skill, side: "attacker" });
    };
    private callDefenderHook(hook: SkillHook) {
        this.callSkillHook({ hookName: hook.hookName, skill: hook.skill, side: "defender" });
    };
    private callSkillHook(hook: SkillHook) {
        if (hook.skill[hook.hookName]) {
            const hookParam = hook.side === "attacker" ? {
                wielder: this.attacker, enemy: this.defender,
            } : { wielder: this.defender, enemy: this.attacker };
            hook.skill[hook.hookName](hookParam);
        }
    };
    private runAllAttackerSkillsHooks(hookName: hookNames) {
        for (let skillSlot in this.attacker.skills) {
            let skill = this.attacker.skills[skillSlot];
            this.callAttackerHook({ skill, hookName });
        }
    };
    private getAffinity(affinityPredicate: AffinityArguments) {
        return affinityPredicate.predicate({ attacker: affinityPredicate.attacker, defender: affinityPredicate.defender });
    };
    private produceDamage({ attackStat, defenderStat, affinity, advantage, effectiveness }: DamageFormula) {
        const withEffectiveness = Math.floor(attackStat * effectiveness);
        const mainFormula = withEffectiveness + Math.trunc(withEffectiveness * (advantage * ((affinity + 20) / 20))) - defenderStat;
        return Math.max(mainFormula, 0);
    };
    private calculateDamage({ attacker, defender }: Sides) {
        let attackerStats = attacker.getBattleStats();
        let defenderStats = defender.getBattleStats();
        let advantage = this.getAffinity({
            predicate: () => {
                if (defender.getCursorValue("reverseAffinity") > 0) {
                    return getColorRelationship(defender.color, attacker.color);
                }
                if (attacker.getCursorValue("reverseAffinity") > 0) {
                    return 0;
                }
                if (attacker.getCursorValue("artificialAffinity") > 0) {
                    return 0.2;
                }
                return getColorRelationship(attacker.color, defender.color);
            }
        });
        let gemWeaponAffinity = attacker.getCursorValue("gemWeapon") > 0 ? getColorRelationship(attacker.color, defender.color) : 0;
        let statusAffinity = [...attacker.statuses, ...defender.statuses].includes("trilemma") ? getColorRelationship(attacker.color, defender.color) : 0;
        let affinity = Math.max(statusAffinity, gemWeaponAffinity);
        let effectiveness = attacker.getCursorValue("effectiveness") > 0 ? 1.5 : 1;
        let attackStat = attackerStats.atk;
        let defenderStat = attacker.getCursorValue("lowerOfDefAndRes") > 0 ? Math.min(defenderStats.def, defenderStats.res) :
            ["tome", "dragonstone"].includes(attacker.skills.weapon.type) ? defenderStats.res : defenderStats.def;
        let damage = this.produceDamage({ attackStat, defenderStat, advantage, affinity, effectiveness });
        damage += attacker.getCursorValue("damageIncrease") - defender.getCursorValue("damageReduction");
        if (attacker.skills.weapon.type === "staff" && attacker.getCursorValue("staffDamageLikeOtherWeapons") <= 0) {
            damage = Math.floor(damage / 2);
        }
        return {
            advantage: advantage === 0 ? "neutral" : advantage === 0.2 ? "advantage" : "disadvantage" as "neutral" | "advantage" | "disadvantage",
            damage,
            effective: effectiveness === 1 ? false : true
        }
    };

    private generateStartupTurns({ attacker: turnAttacker, defender: turnDefender }: Turn): Turn[] {
        let turns: Turn[] = [];
        let consecutiveTurns = 1;
        if (turnAttacker.getCursorValue("desperation") > 0) {
            consecutiveTurns *= 2;
        }
        if (turnAttacker.getCursorValue("braveWeapon") > 0) {
            consecutiveTurns *= 2;
        }
        return this.stackSameTurns({ attacker: turnAttacker, defender: turnDefender, iterations: consecutiveTurns, turns });
    };

    private runAllDefenderSkillsHooks(hookName: hookNames) {
        for (let skillSlot in this.defender.skills) {
            let skill = this.defender.skills[skillSlot];
            this.callDefenderHook({ skill, hookName });
        }
    };
    private stackSameTurns(turnArgument: TurnArgument) {
        let { attacker, defender, iterations, turns } = turnArgument;
        let i = 0;
        let previousAttackerTurns = this.getPreviousAttackTurns({ heroId: attacker.id, turns }).length;
        let turnsCopy = [...turns];
        while (i < iterations) {
            turnsCopy.push({ attacker, defender, order: previousAttackerTurns + 1 });
            i++;
        }
        return turnsCopy;
    };
    private setupTurns() {
        let turns: Turn[] = [];
        const sameRange = this.defender.getWeapon().range === this.attacker.getWeapon().range;
        const counterattackAllowed = this.defender.getCursorValue("counterattack") >= 0;
        let defenderCanFightBack = sameRange ? counterattackAllowed : this.defender.getCursorValue("counterattack") > 0;
        if (this.defender.getCursorValue("vantage") > 0 && defenderCanFightBack) {
            turns.push({
                attacker: this.defender,
                defender: this.attacker
            });
        }
        turns = turns.concat(this.generateStartupTurns({ attacker: this.attacker, defender: this.defender }));
        if (defenderCanFightBack) {
            turns = turns.concat(this.generateStartupTurns({ attacker: this.defender, defender: this.attacker }));
        }
        turns = turns.concat(this.handleFollowups({ attacker: this.attacker, defender: this.defender }));
        if (defenderCanFightBack) {
            turns = turns.concat(this.handleFollowups({ attacker: this.defender, defender: this.attacker }));
        }
        return turns;
    };
    private getPreviousAttackTurns(previousTurns: previousTurns) {
        return previousTurns.turns.filter(turn => turn.attacker.id === previousTurns.heroId);
    };
    private handleFollowups({ attacker, defender }: Turn): Turn[] {
        let isNaturalFollowup = attacker.getBattleStats().spd >= defender.getBattleStats().spd + 5 && attacker.getCursorValue("followup") >= 0;
        let isArtificalFollowup = attacker.getCursorValue("followup") > 0 && attacker.getCursorValue("desperation") <= 0;
        if (isNaturalFollowup || isArtificalFollowup) {
            return this.generateStartupTurns({ attacker, defender });
        }
        return [];
    };
    private runAllSkillsHooks(hookName: hookNames) {
        this.runAllAttackerSkillsHooks(hookName);
        this.runAllDefenderSkillsHooks(hookName);
    };
    private runAllyHooks(hookName: hookNames) {
        for (let ally of this.attacker.allies) {
            for (let skillName in ally.skills) {
                let skill = ally.skills[skillName];
                if (skill[hookName]) {
                    skill[hookName].call(null, { wielder: ally, ally: this.attacker, enemy: this.defender });
                }
            }
        }
        for (let ally of this.defender.allies) {
            for (let skillName in ally.skills) {
                let skill = ally.skills[skillName];
                if (skill[hookName]) {
                    skill[hookName].call(null, { wielder: ally, ally: this.defender, enemy: this.attacker });
                }
            }
        }
    };
    createCombat() {
        this.runAllSkillsHooks("modifyCursors");
        this.runAllSkillsHooks("onBeforeCombat");
        this.runAllyHooks("onBeforeAllyCombat");
        this.runAllAttackerSkillsHooks("onInitiate");
        this.runAllDefenderSkillsHooks("onDefense");
        let turns = this.setupTurns();
        const combatData: CombatOutcome = {
            atkChanges: this.attacker.battleMods,
            defChanges: this.defender.battleMods,
            outcome: [],
            atkRemainingHP: 0,
            defRemainingHP: 0,
            atkEffective: false,
            defEffective: false,
            atkDamage: 0,
            defDamage: 0
        };

        for (let turn of turns) {
            let attackOutcome = this.calculateDamage({ attacker: turn.attacker, defender: turn.defender });
            const { damage } = attackOutcome;
            const remainingHP = Math.max(0, turn.defender.stats.hp - damage);
            turn.defender.stats.hp = Math.max(0, turn.defender.stats.hp - damage);
            combatData.outcome.push({ attacker: turn.attacker, defender: turn.defender, ...attackOutcome, remainingHP });
            combatData.atkDamage += this.attacker.id === turn.attacker.id ? damage : 0;
            combatData.defDamage += this.defender.id === turn.attacker.id ? damage : 0;
            combatData.atkRemainingHP = turn.attacker.id === this.attacker.id ? turn.attacker.stats.hp : turn.defender.stats.hp;
            combatData.defRemainingHP = turn.defender.id === this.defender.id ? turn.defender.stats.hp : turn.attacker.stats.hp;
            if (turn.attacker.id === this.attacker.id) {
                combatData.atkEffective = attackOutcome.effective;
            } else {
                combatData.defEffective = attackOutcome.effective;
            }            
            if (turn.defender.stats.hp === 0) return combatData;
        }
        return combatData;
    };
};

export default Combat;
