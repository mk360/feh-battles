import { SkillEffect } from "./base_skill";
import BattleState from "./battle_state";
import Hero from "./hero";
import Skill from "./passive_skill";
import SpecialManager from "./specials-manager";
import { StatsBuffsTable } from "./types";
import { WeaponColor } from "./weapon";
import cloneDeep from "lodash.clonedeep";

export interface Combat {
    attacker: Hero,
    defender: Hero,
    battleState: BattleState;
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
    attackerSpecialCooldown: number;
    defenderSpecialCooldown: number;
    attackerTriggeredSpecial: boolean,
    defenderTriggeredSpecial: boolean,
    advantage: Advantage,
    effective: boolean,
    remainingHP: number,
    damage: number
}

interface CombatOutcomeSide {
    startHP: number;
    turns: number;
    id: string;
    remainingHP: number;
    damage: number;
    effective: boolean;
    triggeredSpecial: boolean;
    statChanges: StatsBuffsTable;
    extraDamage: number;
};

export interface CombatOutcome {
    attacker: CombatOutcomeSide;
    defender: CombatOutcomeSide;
    turns: TurnOutcome[]
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

type HookName = "onEquip" | "onInitiate" | "onDefense" | "onBeforeCombat" | "onTurnStart" | "onAllyInitiate" | "onAllyDefense" | "onBeforeAllyCombat" | "modifyCursors" | "onRoundAttack" | "onRoundDefense";

type HookSide = "defender" | "attacker";

type Advantage = "advantage" | "disadvantage" | "neutral";

interface SkillHook {
    skill: Skill,
    hookName: HookName
    side?: HookSide
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
    private specialsManager = new SpecialManager();

    constructor({ attacker, defender, battleState }: { attacker: Hero, defender: Hero, battleState: BattleState }) {
        this.attacker = this.cloneHero(attacker);
        this.defender = this.cloneHero(defender);
        this.battleState = battleState;
    };

    private cloneHero(hero: Hero) {
        const clone = cloneDeep(hero) as Hero;
        clone.allies = hero.allies;
        clone.enemies = hero.enemies;
        return clone;
    }

    private callSkillHook(hook: SkillHook, extraArgs?: Omit<SkillEffect, 'wielder' | 'enemy' | 'battleState'>) {
        if (hook.skill[hook.hookName]) {
            if (hook.hookName === "onRoundDefense") {
                console.log(hook.skill, hook.hookName, hook.skill[hook.hookName]);
            }
            const hookParams = hook.side === "attacker" ? {
                wielder: this.attacker, enemy: this.defender,
            } : { wielder: this.defender, enemy: this.attacker };
            const extraArgsObject = extraArgs ?? {};
            hook.skill[hook.hookName]({ ...hookParams, battleState: this.battleState, ...extraArgsObject });
        }
    };

    private runAllAttackerSkillsHooks(hookName: HookName, extraArgs?: SkillEffect) {
        for (let skillSlot in this.attacker.skills) {
            let skill = this.attacker.skills[skillSlot];
            this.callSkillHook({ hookName, skill, side: "attacker" }, extraArgs);
        }
    };

    private getAffinity({ attacker, defender }: { attacker: Hero; defender: Hero }) {
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
    };

    private produceDamage({ attackStat, defenderStat, affinity, advantage, effectiveness }: DamageFormula) {
        const withEffectiveness = Math.trunc(attackStat * effectiveness);
        const mainFormula = withEffectiveness - defenderStat + (withEffectiveness * (advantage * Math.trunc((affinity + 20) / 20)));
        return Math.max(mainFormula, 0);
    };

    private calculateDamage({ attacker, defender }: Sides) {
        let attackerStats = attacker.getBattleStats();
        let defenderStats = defender.getBattleStats();
        let advantage = this.getAffinity({ attacker, defender });
        let gemWeaponAffinity = attacker.getCursorValue("gemWeapon") > 0 ? getColorRelationship(attacker.color, defender.color) : 0;
        let statusAffinity = attacker.statuses.concat(defender.statuses).includes("trilemma") ? getColorRelationship(attacker.color, defender.color) : 0;
        let affinity = Math.max(statusAffinity, gemWeaponAffinity);
        let effectiveness = attacker.getCursorValue("effectiveness") > 0 ? 1.5 : 1;
        let attackStat = attackerStats.atk;
        let defenderStat = attacker.getCursorValue("lowerOfDefAndRes") > 0 ? Math.min(defenderStats.def, defenderStats.res) :
            ["tome", "dragonstone"].includes(attacker.skills.weapon.type) ? defenderStats.res : defenderStats.def;
        let damage = this.produceDamage({ attackStat, defenderStat, advantage, affinity, effectiveness });
        damage += attacker.getCursorValue("damageIncrease");
        damage = Math.ceil(damage * defender.getCursorValue("damageReduction"));

        if (attacker.skills.weapon.type === "staff" && attacker.getCursorValue("staffDamageLikeOtherWeapons") <= 0) {
            damage = Math.trunc(damage / 2);
        }

        return {
            advantage: advantage === 0 ? "neutral" : advantage === 0.2 ? "advantage" : "disadvantage" as Advantage,
            damage,
            effective: effectiveness > 1
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

    private runAllDefenderSkillsHooks(hookName: HookName, extraArgs?: SkillEffect) {
        for (let skillSlot in this.defender.skills) {
            let skill = this.defender.skills[skillSlot];
            this.callSkillHook({ hookName, skill, side: "defender" }, extraArgs);
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

    private runAllSkillsHooks(hookName: HookName) {
        this.runAllAttackerSkillsHooks(hookName);
        this.runAllDefenderSkillsHooks(hookName);
    };

    private runAllyHooks(hookName: HookName, extraArgs?: Omit<SkillEffect, 'wielder' | 'enemy'>) {
        for (let ally of this.attacker.allies) {
            for (let skillName in ally.skills) {
                let skill = ally.skills[skillName];
                if (skill[hookName]) {
                    skill[hookName].apply(null, [{ wielder: ally, ally: this.attacker, enemy: this.defender },  extraArgs]);
                }
            }
        }
        for (let ally of this.defender.allies) {
            for (let skillName in ally.skills) {
                let skill = ally.skills[skillName];
                if (skill[hookName]) {
                    skill[hookName].apply(null, [{ wielder: ally, ally: this.defender, enemy: this.attacker },  extraArgs]);
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
        this.runAllAttackerSkillsHooks("onRoundAttack", { wielder: this.attacker, enemy: this.defender });
        this.runAllAttackerSkillsHooks("onRoundDefense", { wielder: this.attacker, enemy: this.defender });
        this.runAllDefenderSkillsHooks("onRoundAttack", { wielder: this.defender, enemy: this.attacker });
        this.runAllDefenderSkillsHooks("onRoundDefense", { wielder: this.defender, enemy: this.attacker });
        let turns = this.setupTurns();
        const combatData: CombatOutcome = {
            attacker: {
                statChanges: this.attacker.battleMods,
                remainingHP: 0,
                id: this.attacker.id,
                triggeredSpecial: false,
                turns: 0,
                startHP: this.attacker.stats.hp,
                effective: false,
                damage: 0,
                extraDamage: 0
            },
            defender: {
                statChanges: this.defender.battleMods,
                remainingHP: 0,
                id: this.defender.id,
                startHP: this.defender.stats.hp,
                turns: 0,
                triggeredSpecial: false,
                effective: false,
                damage: 0,
                extraDamage: 0
            },
            turns: [],
        };

        for (let turn of turns) {
            let attackOutcome = this.calculateDamage({ attacker: turn.attacker, defender: turn.defender });
            const { damage } = attackOutcome;

            const turnOutcome: TurnOutcome = {
                attacker: turn.attacker,
                defender: turn.defender,
                ...attackOutcome,
                remainingHP: 0,
                damage,
                attackerSpecialCooldown: this.attacker.skills.special?.currentCooldown || 0,
                defenderSpecialCooldown: this.attacker.skills.special?.currentCooldown || 0,
                attackerTriggeredSpecial: false,
                defenderTriggeredSpecial: false
            };

             if (turn.attacker.skills.special?.currentCooldown === 0 && turn.attacker.skills.special?.shouldTrigger({
                damage, wielder: turn.attacker,
                enemy: turn.defender,
                attacker: turn.attacker,
                defender: turn.defender,
                battleState: this.battleState
            })) {
                const output = turn.attacker.skills.special?.trigger({
                    damage,
                    wielder: turn.attacker,
                    enemy: turn.defender,
                    battleState: this.battleState
                });

                if (typeof output === "number") {
                    turnOutcome.damage = Math.floor(output);
                }
                turnOutcome.attackerTriggeredSpecial = true;
            }

            turnOutcome.remainingHP = Math.max(0, turn.defender.stats.hp - turnOutcome.damage);
            turn.defender.stats.hp = Math.max(0, turn.defender.stats.hp - turnOutcome.damage);

            if (turn.defender.skills.special?.currentCooldown === 0 && turn.defender.skills.special?.shouldTrigger({
                damage, wielder: turn.defender,
                enemy: turn.attacker,
                battleState: this.battleState,
                attacker: turn.attacker,
                defender: turn.defender
            })) {
                const output = turn.defender.skills.special?.trigger({
                    damage,
                    wielder: turn.defender,
                    enemy: turn.attacker,
                    battleState: this.battleState
                });

                turnOutcome.defenderTriggeredSpecial = true;
            }

            if (this.attacker.skills.special) {
                this.attacker.skills.special.currentCooldown = this.specialsManager.getCooldownAfterHit(this.attacker, turnOutcome.attackerTriggeredSpecial);
            }

            if (this.defender.skills.special) {
                this.defender.skills.special.currentCooldown = this.specialsManager.getCooldownAfterHit(this.defender, turnOutcome.defenderTriggeredSpecial);
            }

            combatData.turns.push(turnOutcome);

            if (turn.attacker.id === this.attacker.id) {
                combatData.attacker.effective = attackOutcome.effective;
                combatData.attacker.remainingHP = turn.attacker.stats.hp;
                combatData.defender.remainingHP = turn.defender.stats.hp;
                combatData.attacker.damage = damage;
                combatData.attacker.turns++;
            } else {
                combatData.defender.effective = attackOutcome.effective;
                combatData.attacker.remainingHP = turn.defender.stats.hp;
                combatData.defender.remainingHP = turn.attacker.stats.hp;
                combatData.defender.damage = damage;
                combatData.defender.turns++;
            }
            if (turnOutcome.defender.stats.hp === 0) break;
        }
        return combatData;
    };
};

export default Combat;
