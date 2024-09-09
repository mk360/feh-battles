import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import getCombatStats from "../systems/get-combat-stats";
import applyMapComponent from "../systems/apply-map-effect";

/**
 * Apply specified map buff to adjacent allies
 */
export function honeStat(skill: Skill, state: GameState, stat: Stat, buff: number) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) === 1) {
            applyMapComponent(ally, "MapBuff", {
                [stat]: buff,
            }, skill.entity);
        }
    }
}

export function mapBuffByMovementType(skill: Skill, state: GameState, movementType: MovementType, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (ally.getOne("MovementType").value === movementType) {
            applyMapComponent(ally, "MapBuff", {
                ...buffs,
            }, skill.entity);
        }
    }
}

export function mapBuffByRange(skill: Skill, state: GameState, range: number, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) <= range) {
            applyMapComponent(ally, "MapBuff", {
                ...buffs,
            }, skill.entity);
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

/**
 * If unit has 50% HP or less, add specified Map Buffs
 */
export function defiant(skill: Skill, stat: Stat, buff: number) {
    const { maxHP, hp } = skill.entity.getOne("Stats");
    if (hp / maxHP <= 0.5) {
        applyMapComponent(skill.entity, "MapBuff", {
            [stat]: buff,
        }, skill.entity);
    }
}

/**
 * If enemy has specified weapon and unit has specified % of HP, prevents enemy from doing a followup, and guarantees unit followup on them.
 */
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

/**
 * Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.
 */
export function raven(skill: Skill, enemy: Entity) {
    if (enemy.getOne("Weapon").color === "colorless") {
        skill.entity.addComponent({
            type: "GuaranteedAdvantage"
        });
    }
}

/**
 * Grants Combat Buffs if unit is adjacent to ally
 */
export function bond(skill: Skill, state: GameState, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, skill.entity) === 1) {
            skill.entity.addComponent({
                type: "CombatBuff",
                ...buffs
            });
            return;
        }
    }
}

/**
 * Fire, Water, Wind, etc. Boosts: if HP >= enemy HP + 3, apply specified Combat Buffs
 */
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

/**
 * If `shouldActivate` is met, heal unit.
 */
export function renewal(skill: Skill, shouldActivate: boolean, amount: number) {
    if (shouldActivate) {
        skill.entity.addComponent({
            type: "Heal",
            value: amount
        });
    }
}

/**
 * If enemy is 2 or less spaces away from unit, apply specified debuffs
 */
export function threaten(skill: Skill, state: GameState, statDebuffs: Stats) {
    const enemies = getEnemies(state, skill.entity);
    for (let enemy of enemies) {
        if (HeroSystem.getDistance(enemy, skill.entity) <= 2) {
            applyMapComponent(enemy, "MapDebuff", {
                ...statDebuffs,
            }, skill.entity);
        }
    }
}

/**
 * Lowers target's map stats by specified debuffs. Lowers enemies' map stats by specified debuffs, if they are max. 2 tiles away from target.
 */
export function dagger(skill: Skill, state: GameState, target: Entity, debuffs: Stats) {
    const allies = getAllies(state, target);
    applyMapComponent(target, "MapDebuff", {
        ...debuffs,
    }, skill.entity);

    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, target) <= 2) {
            applyMapComponent(ally, "MapDebuff", {
                ...debuffs,
            }, skill.entity);
        }
    }
};

export function counterattack(skill: Skill) {
    skill.entity.addComponent({
        type: "Counterattack"
    });
};

/**
 * Add Combat Buffs to all stats matching 2 * adjacent units count
 */
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

/**
 * Add Combat Buffs to Atk = total map buffs on unit. Ignores Penalties.
 */
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
