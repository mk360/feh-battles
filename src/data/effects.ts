import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
import getAllies from "../utils/get-alies";
import { WeaponType } from "../weapon";
import { CombatOutcome } from "../combat";
import getEnemies from "../utils/get-enemies";

export function honeStat(thisArg: Skill, state: GameState, stat: Stat, buff: number) {
    const allies = getAllies(state, thisArg.entity);
    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, thisArg.entity) === 1) {
            ally.addComponent({
                type: "MapBuff",
                [stat]: buff
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
        }
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

export function renewal(thisArg: Skill, shouldActivate: () => boolean, amount: number) {
    if (shouldActivate()) {
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
        }
    }
}

export function dagger(state: GameState, target: Entity, debuffs: Stats) {
    const allies = getAllies(state, target);
    target.addComponent({
        type: "MapDebuff",
        ...debuffs,
    });

    for (let ally of allies) {
        if (HeroSystem.getDistance(ally, target) <= 2) {
            ally.addComponent({
                type: "MapDebuff",
                ...debuffs,
            });     
        }
    }
};

export function counterattack(thisArg: Skill) {
    thisArg.entity.addComponent({
        type: "Counterattack"
    });
};

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
