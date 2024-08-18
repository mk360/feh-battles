import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import getCombatStats from "../systems/get-combat-stats";

export function honeStat(skill: Skill, state: GameState, stat: Stat, buff: number) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) === 1) {
            ally.addComponent({
                type: "MapBuff",
                [stat]: buff
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: skill.entity
            });
        }
    }
}

export function mapBuffByMovementType(skill: Skill, state: GameState, movementType: MovementType, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (ally.getOne("MovementType").value === movementType) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: skill.entity
            });
        }
    }
}

export function mapBuffByRange(skill: Skill, state: GameState, range: number, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) <= range) {
            ally.addComponent({
                type: "MapBuff",
                ...buffs
            });
            ally.addComponent({
                type: "Status",
                value: "Bonus",
                source: skill.entity
            });
        }
    }
}

export function dodgeStat(skill: Skill, enemy: Entity, comparedStat: Stat) {
    const heroStats = getCombatStats(skill.entity);
    const enemyStats = getCombatStats(enemy);
    if (heroStats[comparedStat] > enemyStats[comparedStat]) {
        const diff = heroStats[comparedStat] - enemyStats[comparedStat];
        skill.entity.addComponent({
            type: "DamageReduction",
            percentage: Math.min(40, diff * 4) / 100
        });
    }
}

export function combatBuffByRange(skill: Skill, ally: Entity, range: number, buffs: Stats) {
    if (HeroSystem.getDistance(ally, skill.entity) <= range) {
        ally.addComponent({
            type: "CombatBuff",
            ...buffs
        });
    }
}

export function combatBuffByMovementType(skill: Skill, ally: Entity, movementType: MovementType, buffs: Stats) {

};

export function defiant(skill: Skill, stat: Stat, buff: number) {
    const { maxHP, hp } = skill.entity.getOne("Stats");
    if (hp / maxHP <= 0.5) {
        skill.entity.addComponent({
            type: "MapBuff",
            [stat]: buff
        });
        skill.entity.addComponent({
            type: "Status",
            value: "Bonus",
            source: skill.entity
        });
    }
}

export function breaker(skill: Skill, enemy: Entity, targetWeaponType: WeaponType, hpPercentage: number) {
    const { value } = enemy.getOne("WeaponType");
    const { hp, maxHP } = skill.entity.getOne("Stats");
    if (value === targetWeaponType && hp / maxHP >= hpPercentage) {
        enemy.addComponent({
            type: "PreventFollowUp"
        });
        skill.entity.addComponent({
            type: "GuaranteedFollowup"
        });
    }
}

export function raven(skill: Skill, enemy: Entity) {
    if (enemy.getOne("Weapon").color === "colorless") {
        skill.entity.addComponent({
            type: "GuaranteedAdvantage"
        });
    }
}

export function bond(skill: Skill, state: GameState, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) === 1) {
            console.log(skill.entity.getOne("Name").value, ally.getOne("Name").value);
            skill.entity.addComponent({
                type: "CombatBuff",
                ...buffs
            });
            return;
        }
    }
}

export function elementalBoost(skill: Skill, target: Entity, buffs: Stats) {
    const wielderHP = skill.entity.getOne("Stats").hp;
    const enemyHP = target.getOne("Stats").hp;

    if (wielderHP >= enemyHP + 3) {
        skill.entity.addComponent({
            type: "CombatBuff",
            ...buffs
        });
    }
};

export function renewal(skill: Skill, shouldActivate: boolean, amount: number) {
    if (shouldActivate) {
        skill.entity.addComponent({
            type: "Heal",
            value: amount
        });
    }
}

export function threaten(skill: Skill, state: GameState, statDebuffs: Stats) {
    const enemies = getEnemies(state, skill.entity);
    for (let enemy of enemies) {
        if (HeroSystem.getDistance(enemy, skill.entity) <= 2) {
            enemy.addComponent({
                type: "MapDebuff",
                ...statDebuffs
            });
            enemy.addComponent({
                type: "Status",
                value: "Penalty",
                source: skill.entity
            });
        }
    }
}

export function dagger(skill: Skill, state: GameState, target: Entity, debuffs: Stats) {
    const allies = getAllies(state, target);
    target.addComponent({
        type: "MapDebuff",
        ...debuffs,
    });
    target.addComponent({
        type: "Status",
        value: "Penalty",
        source: skill.entity
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
                source: skill.entity
            });
        }
    }
};

export function counterattack(skill: Skill) {
    skill.entity.addComponent({
        type: "Counterattack"
    });
};

export function owl(skill: Skill, state: GameState) {
    const allies = getAllies(state, this.entity).filter((ally) => HeroSystem.getDistance(ally, this.entity) === 1);
    const buff = allies.length * 2;

    skill.entity.addComponent({
        type: "CombatBuff",
        atk: buff,
        def: buff,
        spd: buff,
        res: buff,
    });
}

export function blade(skill: Skill) {
    const mapBuffs = skill.entity.getComponents("MapBuff");
    let statsSum = 0;
    mapBuffs.forEach((buff) => {
        const { atk, def, res, spd } = buff;
        statsSum += atk + def + res + spd;
    });

    skill.entity.addComponent({
        type: "CombatBuff",
        atk: statsSum
    });
};
