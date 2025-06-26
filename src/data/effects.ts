import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats, WeaponType } from "../interfaces/types";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import getCombatStats from "../systems/get-combat-stats";
import { applyMapComponent } from "../systems/apply-map-effect";
import getSurroundings from "../systems/get-surroundings";
import canReachTile from "../systems/can-reach-tile";
import getTileCoordinates from "../systems/get-tile-coordinates";
import getPosition from "../systems/get-position";
import Direction from "../systems/directions";
import tileBitmasks from "./tile-bitmasks";

/**
 * Specified target can move to any tile adjacent to calling ally within 2 spaces
 * for ex. if Hinoka calls this effect, allies can move to one space near Hinoka
 */
export function guidance(sourceEntity: Entity, state: GameState, target: Entity) {
    const { x, y } = sourceEntity.getOne("Position");
    const tile = state.map[y][x];
    const surroundings = getSurroundings(state.map, y, x);
    surroundings.splice(surroundings.indexOf(tile), 1);
    const validAllyTiles = surroundings.filter((tile) => canReachTile(target, tile));
    for (let tile of validAllyTiles) {
        const { x: tileX, y: tileY } = getTileCoordinates(tile);
        target.addComponent({
            type: "WarpTile",
            x: tileX,
            y: tileY
        });
    }
};

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

/**
 * If specified combat stat > enemy's combat stat, reduce damage by 4x difference (max. 40%)
 */
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

/**
 * Unconditionally apply a Combat Buff if there's an ally within the specified range
 */
export function combatBuffByRange(skill: Skill, ally: Entity, range: number, buffs: Stats) {
    if (HeroSystem.getDistance(ally, skill.entity) <= range) {
        ally.addComponent({
            type: "CombatBuff",
            ...buffs
        });
    }
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
 * If enemy has specified weapon and unit has at least specified % of HP, prevents enemy from doing a followup, and guarantees unit followup on them.
 */
export function breaker(skill: Skill, enemy: Entity, targetWeaponType: WeaponType, hpPercentage: number) {
    const { weaponType } = enemy.getOne("Weapon");
    const { hp, maxHP } = skill.entity.getOne("Stats");
    if (weaponType === targetWeaponType && hp / maxHP >= hpPercentage) {
        skill.entity.addComponent({
            type: "PreventFollowup"
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

/**
 * Allow unit to counterattack, regardless of range, barring any other blocking effect.
 */
export function counterattack(skill: Skill) {
    skill.entity.addComponent({
        type: "Counterattack"
    });
};

/**
 * Add Combat Buffs to all stats matching 2 * adjacent allies count
 */
export function owl(skill: Skill, state: GameState) {
    const allies = getAllies(state, skill.entity).filter((ally) => HeroSystem.getDistance(ally, skill.entity) === 1);
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
export function bladeTome(skill: Skill) {
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

/**
 * Make two entities swap spaces. Make sure the `checker` function returns true before calling the runner.
 */
export function swap() {
    return {
        checker(state: GameState, entity1: Entity, entity2: Entity) {
            const pos1 = getPosition(entity1);
            const pos2 = getPosition(entity2);
            const tile1 = state.map[pos1.y][pos1.x];
            const tile2 = state.map[pos2.y][pos2.x];

            return canReachTile(entity1, tile2) && canReachTile(entity2, tile1);
        },
        runner(state: GameState, entity1: Entity, entity2: Entity) {
            const firstPosition = getPosition(entity1);
            const secondPosition = getPosition(entity2);

            entity1.addComponent({
                type: "Swap",
                x: secondPosition.x,
                y: secondPosition.y,
                assistTarget: {
                    entity: entity2,
                    x: firstPosition.x,
                    y: firstPosition.y
                },
            });

            entity1.addComponent({
                type: "Move",
                x: secondPosition.x,
                y: secondPosition.y,
            });

            entity2.addComponent({
                type: "Move",
                x: firstPosition.x,
                y: firstPosition.y
            });
        }
    }
};

/**
 * Push an entity in the opposite direction of the effect caller, within the defined range, and to a valid tile. The target entity cannot bypass entities that are in the Shove path, but
 * may cross unpassable terrain (except walls) if they will land on a valid tile. Make sure the `checker` function returns true before calling the runner.
 */
export function shove(state: GameState, caller: Entity, shoved: Entity, range: number) {
    const pos1 = getPosition(caller).getObject(false);
    const pos2 = getPosition(shoved).getObject(false);

    const direction = new Direction(0, 0);

    let atLeastOneTile = false;
    let targetTile: Uint16Array;

    for (let i = 0; i < range; i++) {
        const cumulatedDirection = direction.add(pos2.x - pos1.x, pos2.y - pos1.y);
        const newTile = state.map[pos2.y + cumulatedDirection.y]?.[pos2.x + cumulatedDirection.x];
        if (!newTile) {
            atLeastOneTile = (i - 1) > 0; // if out of bounds, then surely last valid tile is correct?
            break;
        }
        const isValid = canReachTile(shoved, newTile) && (newTile & tileBitmasks.occupation) === 0;
        atLeastOneTile = isValid;
        targetTile = newTile;
        if (atLeastOneTile && i < range) continue;
        if (!atLeastOneTile) {
            atLeastOneTile = i > 0;
            break;
        }
    }

    return {
        checker() {
            return atLeastOneTile;
        },
        runner() {
            const { x, y } = getTileCoordinates(targetTile);

            shoved.addComponent({
                type: "Move",
                x,
                y,
            });

            caller.addComponent({
                type: "Shove",
                x,
                y,
                target: shoved,
            });
        }
    }
}

/**
 * Unit moves 1 tile behind. A second unit should be specified in order to create the "behind" vector.
 * Before running the `runner` function, check if `checker` returns true.
 */
export function retreat(state: GameState, target: Entity, referencePoint: Entity, checkedCoordinates?: { x: number; y: number }) {
    const pos1 = checkedCoordinates ?? getPosition(target).getObject(false);
    const pos2 = getPosition(referencePoint).getObject(false);

    const direction = new Direction(pos1.x - pos2.x, pos1.y - pos2.y);
    const newPos1 = new Direction(pos1.x, pos1.y).add(direction.x, direction.y);
    const newPos2 = { x: pos1.x, y: pos2.y };

    return {
        checker() {
            const newTile1 = state.map[newPos1.y]?.[newPos1.x];
            if (!newTile1) return false;
            const isValid1 = canReachTile(target, newTile1) && ((newTile1[0] & tileBitmasks.occupation) === 0 || state.occupiedTilesMap.get(newTile1).id === target.id);
            const isValid2 = canReachTile(referencePoint, state.map[pos1.y]?.[pos1.x], true);

            return isValid1 && isValid2;
        },
        runner(applyToReferencePoint = false) {
            target.addComponent({
                type: "Move",
                x: newPos1.x,
                y: newPos1.y,
            });

            target.addComponent({
                type: "DrawBack",
                ...newPos1,
                oldX: pos1.x,
                oldY: pos1.y,
            });

            if (applyToReferencePoint) {
                referencePoint.addComponent({
                    type: "Move",
                    ...newPos2,
                });

                referencePoint.addComponent({
                    type: "DrawBack",
                    ...newPos2,
                    oldX: pos2.x,
                    oldY: pos2.y,
                });
            }
        }
    }
}

/**
 * Heavy, Flashing, etc. Blade
 */
export function bladeWeapon(skill: Skill, comparedStat: Stat, margin: number) {

};

/**
 * Balm Specials for staff users
 */
export function balm(skill: Skill, state: GameState, buffs: Stats) {
    const allies = getAllies(state, skill.entity);
    for (let ally of allies) {
        applyMapComponent(ally, "MapBuff", buffs, skill.entity);
    }
}

/**
 * If unit or allies' movement type count in team <= 2, apply specified buffs
 */
export function tactic(thisArg: Skill, state: GameState, affectedStat: Stat, buff: number) {
    const userMovementType = thisArg.entity.getOne("MovementType").value;

    const allies = getAllies(state, thisArg.entity);

    if (state.teamsByMovementTypes[thisArg.entity.getOne("Side").value][userMovementType] <= 2) {
        applyMapComponent(thisArg.entity, "MapBuff", {
            [affectedStat]: buff
        }, thisArg.entity);
    }

    for (let ally of allies) {
        const allyMovementType = ally.getOne("MovementType").value;
        if (state.teamsByMovementTypes[thisArg.entity.getOne("Side").value][allyMovementType] <= 2) {
            applyMapComponent(ally, "MapBuff", {
                [affectedStat]: buff
            }, thisArg.entity);
        }
    }
}

/**
 * Apply specified buffs to specified stat to unit and allies if they are adjacent to each other
 */
export function wave(affectedStat: Stat, parity: (turnCount: number) => boolean, buff: number) {
    return function (this: Skill, state: GameState) {
        if (parity(state.turn)) {
            applyMapComponent(this.entity, "MapBuff", {
                [affectedStat]: buff
            }, this.entity);
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        [affectedStat]: buff
                    }, this.entity);
                }
            }
        }
    }
}

/**
 * If there are enemies within the same column or row as unit, check whether
 * unit has higher Res, and, if true, apply specified debuffs
 */
export function ploy(skill: Skill, state: GameState, affectedStat: Stat, debuff: number) {
    const { x, y } = skill.entity.getOne("Position");
    const enemies = getEnemies(state, skill.entity);

    for (let enemy of enemies) {
        const enemyPos = enemy.getOne("Position");
        const isCardinal = x === enemyPos.x || y === enemyPos.y;
        if (isCardinal) {
            const resIsHigher = skill.entity.getOne("Stats").res > enemy.getOne("Stats").res;
            if (resIsHigher) {
                applyMapComponent(enemy, "MapDebuff", {
                    [affectedStat]: debuff
                }, skill.entity);
            }
        }
    }
}

/**
 * Returns a closure that adds combat buffs to ally if they match a certain movement type and are within a specified range
 */
export function movementBasedCombatBuff(buff: Stats, range: number) {
    return function (movementType: MovementType) {
        return function (this: Skill, state: GameState, ally: Entity) {
            if (ally.getOne("MovementType").value === movementType && HeroSystem.getDistance(ally, this.entity) <= range) {
                applyMapComponent(ally, "MapBuff", buff, this.entity);
            }
        }
    }
}
