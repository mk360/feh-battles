import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import getCombatStats from "../systems/get-combat-stats";

export function honeStat(thisArg: Skill, state: GameState, stat: Stat, buff: number) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, thisArg.entity) === 1) {
            ally.addComponent({
                type: "MapBuff",
                [stat]: buff
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: thisArg.entity
            });
        }
    }
}

export function mapBuffByMovementType(thisArg: Skill, state: GameState, movementType: MovementType, buffs: Stats) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (ally.getOne("MovementType").value === movementType) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: thisArg.entity
            });
        }
    }
}

export function mapBuffByRange(thisArg: Skill, state: GameState, range: number, buffs: Stats) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, thisArg.entity) <= range) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: thisArg.entity
            });
        }
    }
}

export function dodgeStat(thisArg: Skill, enemy: Entity, comparedStat: Stat) {
    const heroStats = getCombatStats(thisArg.entity);
    const enemyStats = getCombatStats(enemy);
    if (heroStats[comparedStat] > enemyStats[comparedStat]) {
        const diff = heroStats[comparedStat] - enemyStats[comparedStat];
        thisArg.entity.addComponent({
            type: "DamageReduction",
            percentage: Math.min(40, diff * 4) / 100
        });
    }
}

export function combatBuffByRange(thisArg: Skill, ally: Entity, range: number, buffs: Stats) {
    if (HeroSystem.getDistance(ally, thisArg.entity) <= range) {
        ally.addComponent({
            type: "CombatBuff",
            ...buffs
        });
    }
}

export function combatBuffByMovementType(thisArg: Skill, ally: Entity, movementType: MovementType, buffs: Stats) {

};

export function defiant(thisArg: Skill, stat: Stat, buff: number) {
    const { maxHP, hp } = thisArg.entity.getOne("Stats");
    if (hp / maxHP <= 0.5) {
        thisArg.entity.addComponent({
            type: "MapBuff",
            [stat]: buff
        });
        thisArg.entity.addComponent({
            type: "Status",
            value: "Bonus",
            source: thisArg.entity
        });
    }
}

export function breaker(thisArg: Skill, enemy: Entity, targetWeaponType: WeaponType, hpPercentage: number) {
    const { value } = enemy.getOne("WeaponType");
    const { hp, maxHP } = thisArg.entity.getOne("Stats");
    if (value === targetWeaponType && hp / maxHP >= hpPercentage) {
        enemy.addComponent({
            type: "PreventFollowUp"
        });
        thisArg.entity.addComponent({
            type: "GuaranteedFollowup"
        });
    }
}

export function raven(thisArg: Skill, enemy: Entity) {
    if (enemy.getOne("Weapon").color === "colorless") {
        thisArg.entity.addComponent({
            type: "GuaranteedAdvantage"
        });
    }
}

export function bond(thisArg: Skill, state: GameState, buffs: Stats) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, thisArg.entity) === 1) {
            thisArg.entity.addComponent({
                type: "CombatBuff",
                ...buffs
            });
            return;
        }
    }
}

export function elementalBoost(thisArg: Skill, target: Entity, buffs: Stats) {
    const wielderHP = thisArg.entity.getOne("Stats").hp;
    const enemyHP = target.getOne("Stats").hp;

    if (wielderHP >= enemyHP + 3) {
        thisArg.entity.addComponent({
            type: "CombatBuff",
            ...buffs
        });
    }
};

export function renewal(thisArg: Skill, shouldActivate: boolean, amount: number) {
    if (shouldActivate) {
        thisArg.entity.addComponent({
            type: "Heal",
            value: amount
        });
    }
}

export function threaten(thisArg: Skill, state: GameState, statDebuffs: Stats) {
    const enemies = getEnemies(state, thisArg.entity);
    for (let enemy of enemies) {
        if (HeroSystem.getDistance(enemy, thisArg.entity) <= 2) {
            enemy.addComponent({
                type: "MapDebuff",
                ...statDebuffs
            });
            enemy.addComponent({
                type: "Status",
                value: "Penalty",
                source: thisArg.entity
            });
        }
    }
}

export function dagger(thisArg: Skill, state: GameState, target: Entity, debuffs: Stats) {
    const allies = getAllies(state, target);
    target.addComponent({
        type: "MapDebuff",
        ...debuffs,
    });
    target.addComponent({
        type: "Status",
        value: "Penalty",
        source: thisArg.entity
    });

    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, target) <= 2) {
            ally.addComponent({
                type: "MapDebuff",
                ...debuffs,
            });
            ally.addComponent({
                type: "Status",
                value: "Penalty",
                source: thisArg.entity
            });
        }
    }
};

export function counterattack(thisArg: Skill) {
    thisArg.entity.addComponent({
        type: "Counterattack"
    });
};

export function owl(thisArg: Skill, state: GameState) {
    const allies = getAllies(state, this.entity).filter((ally) => HeroSystem.getDistance(ally, this.entity) === 1);
    const buff = allies.length * 2;

    thisArg.entity.addComponent({
        type: "CombatBuff",
        atk: buff,
        def: buff,
        spd: buff,
        res: buff,
    });
}

export function blade(thisArg: Skill) {
    const mapBuffs = thisArg.entity.getComponents("MapBuff");
    let statsSum = 0;
    mapBuffs.forEach((buff) => {
        const { atk, def, res, spd } = buff;
        statsSum += atk + def + res + spd;
    });

    thisArg.entity.addComponent({
        type: "CombatBuff",
        atk: statsSum
    });
};
