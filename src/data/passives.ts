import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import PassiveSkill from "../passive_skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
import { WeaponColor, WeaponType } from "../weapon";
import getAllies from "../utils/get-alies";
import getEnemies from "../utils/get-enemies";
import { mapBuffByMovementType, honeStat, combatBuffByRange, defiant, breaker, elementalBoost, renewal, threaten, bond } from "./effects";
import Characters from "./characters.json";
import getCombatStats from "../systems/get-combat-stats";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";

interface PassivesDict {
    [k: string]: {
        description: string;
        slot: PassiveSkill["slot"];
        allowedMovementTypes?: MovementType[];
        allowedWeaponTypes?: WeaponType[];
        allowedColors?: WeaponColor[];
        protects?: (MovementType | WeaponType)[];
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        onCombatStart?(this: Skill, state: GameState, target: Entity): void;
        onEquip?(this: Skill): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatAfter?(this: Skill, state: GameState, target: Entity): void;
        onTurnStart?(this: Skill, state: GameState): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
    }
}

function ploy(affectedStat: Stat, debuff: number) {
    return function (this: Skill, state: GameState) {
        const { x, y } = this.entity.getOne("Position");
        const enemies = getEnemies(state, this.entity);
        for (let enemy of enemies) {
            const enemyPos = enemy.getOne("Position");
            const isCardinal = x === enemyPos.x || y === enemyPos.y;
            const resIsHigher = this.entity.getOne("Stats").res > enemy.getOne("Stats").res;
            if (isCardinal && resIsHigher) {
                enemy.addComponent({
                    type: "MapDebuff",
                    [affectedStat]: debuff
                });
            }
        }
    }
}

const ward = movementBasedCombatBuff({ def: 4, res: 4 }, 2);
const goad = movementBasedCombatBuff({ atk: 4, spd: 4 }, 2);

function turnIsOdd(turnCount: number) {
    return !!(turnCount & 1);
}

function wave(affectedStat: Stat, parity: (turnCount: number) => boolean, buff: number) {
    return function (this: Skill, state: GameState) {
        if (parity(state.turn)) {
            this.entity.addComponent({
                type: "MapBuff",
                [affectedStat]: buff
            });
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        [affectedStat]: buff
                    });
                }
            }
        }
    }
}

function tactic(thisArg: Skill, state: GameState, affectedStat: Stat, buff: number) {
    const userMovementType = thisArg.entity.getOne("MovementType").value;

    const allies = getAllies(state, thisArg.entity);

    if (state.teamsByMovementTypes[thisArg.entity.getOne("Side").value][userMovementType] <= 2) {
        this.entity.addComponent({
            type: "MapBuff",
            [affectedStat]: buff
        });
    }

    for (let ally of allies) {
        const allyMovementType = ally.getOne("MovementType").value;
        if (state.teamsByMovementTypes[thisArg.entity.getOne("Side").value][allyMovementType] <= 2) {
            ally.addComponent({
                type: "MapBuff",
                [affectedStat]: buff
            });
        }
    }
}

function movementBasedCombatBuff(buff: Stats, range: number) {
    return function (movementType: MovementType) {
        return function (this: Skill, state: GameState, ally: Entity) {
            if (ally.getOne("MovementType").value === movementType && HeroSystem.getDistance(ally, this.entity) <= range) {
                ally.addComponent({
                    type: "CombatBuff",
                    ...buff
                });
            }
        }
    }
}

const PASSIVES: PassivesDict = {
    "Distant Counter": {
        description: "Unit can counterattack regardless of enemy range.",
        slot: "A",
        allowedWeaponTypes: ["sword", "axe", "lance", "beast", "breath"]
    },
    "Close Counter": {
        description: "Unit can counterattack regardless of enemy range.",
        slot: "A",
        allowedWeaponTypes: ["bow", "dagger", "tome", "staff"]
    },
    "Crusader's Ward": {
        description: "If unit receives consecutive attacks and foe's Range = 2, reduces damage from foe's second attack onward by 80%. (Skill cannot be inherited.)",
        exclusiveTo: ["Sigurd: Holy Knight"],
        onCombatRoundDefense(enemy, combatRound) {
            if (combatRound.consecutiveTurnNumber > 1 && enemy.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.8
                });
            } else {
                this.entity.removeComponent("DamageReduction");
            }
        },
        slot: "B",
    },
    "Follow-Up Ring": {
        description: "At start of combat, if unit's HP ≥ 50%, unit makes a guaranteed follow-up attack. (Skill cannot be inherited.)",
        slot: "B",
        exclusiveTo: ["Arden: Strong and Tough"],
        onCombatStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        }
    },
    "Sacae's Blessing": {
        description: "If foe uses sword, lance, or axe, foe cannot counterattack. (Skill cannot be inherited.)",
        slot: "A",
        exclusiveTo: ["Lyn: Brave Lady"],
        onCombatInitiate(state, target) {
            if (["sword", "axe", "lance"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Svalinn Shield": {
        slot: "A",
        protects: ["armored"],
        allowedMovementTypes: ["armored"],
        description: 'Neutralizes "effective against armor" bonuses.',
    },
    "Iote's Shield": {
        slot: "A",
        description: 'Neutralizes "effective against flying" bonuses.',
        protects: ["flier"],
        allowedMovementTypes: ["flier"]
    },
    "Fury 1": {
        description: "Grants Atk/Spd/Def/Res+1. After combat, deals 2 damage to unit.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk++;
            stats.def++;
            stats.spd++;
            stats.res++;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "AfterCombatDamage",
                value: 2
            });
        }
    },
    "Fury 2": {
        description: "Grants Atk/Spd/Def/Res+2. After combat, deals 4 damage to unit.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 2;
            stats.def += 2;
            stats.spd += 2;
            stats.res += 2;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "AfterCombatDamage",
                value: 4
            });
        }
    },
    "Fury 3": {
        description: "Grants Atk/Spd/Def/Res+3. After combat, deals 6 damage to unit.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 3;
            stats.def += 3;
            stats.spd += 3;
            stats.res += 3;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "AfterCombatDamage",
                value: 6
            });
        }
    },
    "Close Def 1": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+2 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 2,
                    res: 2
                });
            }
        },
    },
    "Close Def 2": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+4 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 4,
                    res: 4
                });
            }
        },
    },
    "Close Def 3": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+6 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 6,
                    res: 6
                });
            }
        },
    },
    "Distant Def 1": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+2 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 2,
                    res: 2
                });
            }
        },
    },
    "Distant Def 2": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+4 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 4,
                    res: 4
                });
            }
        },
    },
    "Distant Def 3": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+6 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 6,
                    res: 6
                });
            }
        },
    },
    "Atk/Def Bond 1": {
        description: "If unit is adjacent to an ally, grants Atk/Def+3 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 3,
                def: 3
            });
        }
    },
    "Atk/Def Bond 2": {
        description: "If unit is adjacent to an ally, grants Atk/Def+4 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 4,
                def: 4
            });
        }
    },
    "Atk/Def Bond 3": {
        description: "If unit is adjacent to an ally, grants Atk/Def+5 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 5,
                def: 5
            });
        }
    },
    "Atk/Res Bond 1": {
        description: "If unit is adjacent to an ally, grants Atk/Res+3 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 3,
                res: 3
            });
        }
    },
    "Atk/Res Bond 2": {
        description: "If unit is adjacent to an ally, grants Atk/Res+4 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 4,
                res: 4
            });
        }
    },
    "Atk/Res Bond 3": {
        description: "If unit is adjacent to an ally, grants Atk/Res+5 during combat.",
        slot: "A",
        onCombatStart(state) {
            bond(this, state, {
                atk: 5,
                res: 5
            });
        }
    },
    "Death Blow 1": {
        slot: "A",
        description: "If unit initiates combat, grants Atk+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2
            });
        }
    },
    "Death Blow 2": {
        slot: "A",
        description: "If unit initiates combat, grants Atk+4 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4
            });
        }
    },
    "Death Blow 3": {
        slot: "A",
        description: "If unit initiates combat, grants Atk+6 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 6
            });
        }
    },
    "Armored Blow 1": {
        slot: "A",
        description: "If unit initiates combat, grants Def+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 2
            });
        }
    },
    "Armored Blow 2": {
        slot: "A",
        description: "If unit initiates combat, grants Def+4 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 4
            });
        }
    },
    "Armored Blow 3": {
        slot: "A",
        description: "If unit initiates combat, grants Def+6 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 6
            });
        }
    },
    "Steady Blow 1": {
        description: "If unit initiates combat, grants Spd/Def+2 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 2,
                def: 2
            });
        }
    },
    "Steady Blow 2": {
        description: "If unit initiates combat, grants Spd/Def+4 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 4,
                def: 4
            });
        }
    },
    "Sturdy Blow 1": {
        description: "If unit initiates combat, grants Atk/Def+2 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 2,
                def: 2
            });
        }
    },
    "Sturdy Blow 2": {
        description: "If unit initiates combat, grants Atk/Def+4 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 4,
                def: 4
            });
        }
    },
    "Swift Strike 1": {
        description: "If unit initiates combat, grants Spd/Res+2 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                spd: 2,
                res: 2
            });
        }
    },
    "Swift Strike 2": {
        description: "If unit initiates combat, grants Spd/Res+4 during combat.",
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                spd: 4,
                res: 4
            });
        }
    },
    "Swift Sparrow 1": {
        slot: "A",
        description: "If unit initiates combat, grants Atk/Spd+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2,
                spd: 2
            });
        }
    },
    "Swift Sparrow 2": {
        slot: "A",
        description: "If unit initiates combat, grants Atk/Spd+3 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                spd: 4
            });
        }
    },
    "Water Boost 1": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 2
            });
        },
    },
    "Water Boost 2": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 4
            });
        },
    },
    "Water Boost 3": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 6
            });
        },
    },
    "Wind Boost 1": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 2
            });
        },
    },
    "Wind Boost 2": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 4
            });
        },
    },
    "Wind Boost 3": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 6
            });
        },
    },
    "Earth Boost 1": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 2
            });
        },
    },
    "Earth Boost 2": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 4
            });
        },
    },
    "Earth Boost 3": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 6
            });
        },
    },
    "Fire Boost 1": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 2
            });
        },
    },
    "Fire Boost 2": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 4
            });
        },
    },
    "Fire Boost 3": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 6
            });
        },
    },
    "Grani's Shield": {
        slot: "A",
        description: 'Neutralizes "effective against cavalry" bonuses.',
        protects: ["cavalry"],
        allowedMovementTypes: ["cavalry"]
    },
    "Life and Death 1": {
        description: "Grants Atk/Spd+3. Inflicts Def/Res-3.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 3;
            stats.spd += 3;
            stats.def -= 3;
            stats.res -= 3;
        }
    },
    "Life and Death 2": {
        description: "Grants Atk/Spd+4. Inflicts Def/Res-4.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 4;
            stats.spd += 4;
            stats.def -= 4;
            stats.res -= 4;
        }
    },
    "Life and Death 3": {
        description: "Grants Atk/Spd+5. Inflicts Def/Res-5.",
        slot: "A",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 5;
            stats.spd += 5;
            stats.def -= 5;
            stats.res -= 5;
        }
    },
    "Axebreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 90% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Axebreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 70% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Renewal 1": {
        description: "At the start of every fourth turn, restores 10 HP.",
        onTurnStart(state) {
            renewal(this, state.turn % 4 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 2": {
        description: "At the start of every third turn, restores 10 HP.",
        onTurnStart(state) {
            renewal(this, state.turn % 3 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 3": {
        description: "At start of odd-numbered turns, restores 10 HP.",
        onTurnStart(state) {
            renewal(this, state.turn % 2 === 1, 10);
        },
        slot: "B",
    },
    "Axebreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 50% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Daggerbreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.9);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 90% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Daggerbreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.7);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 70% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Daggerbreaker 3": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.5);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 50% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 90% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "lance", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 70% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 50% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 90% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 70% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 50% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "bow", 0.9);
            }
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 90% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "bow", 0.7);
            }
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 70% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "bow", 0.5);
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 50% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Beorc's Blessing": {
        slot: "B",
        description: `Neutralizes cavalry and flying foes' bonuses (from skills like Fortify, Rally, etc.) during combat.
(Skill cannot be inherited.)`,
        onCombatStart(state, target) {
            if (["flier", "cavalry"].includes(target.getOne("MovementType").value)) {
                target.addComponent({
                    type: "NeutralizeMapBuffs",
                    stats: ["atk", "def", "res", "spd"]
                });
            }
        },
        exclusiveTo: ["Ike: Brave Mercenary"]
    },
    "Defiant Atk 1": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 3);
        }
    },
    "Defiant Atk 2": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 5);
        }
    },
    "Defiant Atk 3": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 7);
        }
    },
    "Defiant Def 1": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 3);
        }
    },
    "Defiant Def 2": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 5);
        }
    },
    "Defiant Def 3": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 7);
        }
    },
    "Defiant Spd 1": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 3);
        }
    },
    "Defiant Spd 2": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 5);
        }
    },
    "Defiant Spd 3": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 7);
        }
    },
    "Defiant Res 1": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 3);
        }
    },
    "Defiant Res 2": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 5);
        }
    },
    "Defiant Res 3": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 7);
        }
    },
    "Breath of Life 1": {
        slot: "C",
        description: "If unit initiates combat, restores 3 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 3
                    });
                }
            }
        }
    },
    "Breath of Life 2": {
        slot: "C",
        description: "If unit initiates combat, restores 5 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 5
                    });
                }
            }
        }
    },
    "Breath of Life 3": {
        slot: "C",
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 7
                    });
                }
            }
        }
    },
    "Guidance 1": {
        slot: "C",
        description: "If unit's HP = 100%, infantry and armored allies within 2 spaces can move to a space adjacent to unit.",
        onTurnStart(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp === maxHP) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                        ally.addComponent({
                            type: "Status",
                            value: "Guidance"
                        });
                    }
                }
            }
        }
    },
    "Guidance 2": {
        slot: "C",
        description: "If unit's HP ≥ 50%, infantry and armored allies within 2 spaces can move to a space adjacent to unit. ",
        onTurnStart(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                        ally.addComponent({
                            type: "Status",
                            value: "Guidance"
                        });
                    }
                }
            }
        }
    },
    "Guidance 3": {
        slot: "C",
        allowedMovementTypes: ["flier"],
        description: "Infantry and armored allies within 2 spaces can move to a space adjacent to unit. ",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                    ally.addComponent({
                        type: "Status",
                        value: "Guidance"
                    });
                }
            }
        }
    },
    "Savage Blow 1": {
        description: "If unit initiates combat, deals 3 damage to foes within 2 spaces of target after combat.",
        slot: "C",
        onCombatInitiate(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "AfterCombatDamage",
                        value: 3
                    });
                }
            }
        }
    },
    "Savage Blow 2": {
        description: "If unit initiates combat, deals 5 damage to foes within 2 spaces of target after combat.",
        slot: "C",
        onCombatInitiate(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "AfterCombatDamage",
                        value: 5
                    });
                }
            }
        }
    },
    "Savage Blow 3": {
        description: "If unit initiates combat, deals 7 damage to foes within 2 spaces of target after combat.",
        slot: "C",
        onCombatInitiate(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "AfterCombatDamage",
                        value: 7
                    });
                }
            }
        }
    },
    "Hone Atk 1": {
        description: "At start of turn, grants Atk+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 2);
        }
    },
    "Hone Atk 2": {
        description: "At start of turn, grants Atk+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 3)
        }
    },
    "Hone Atk 3": {
        description: "At start of turn, grants Atk+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 4);
        }
    },
    "Hone Atk 4": {
        description: "At start of turn, grants Atk+7 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 7);
        }
    },
    "Hone Spd 1": {
        description: "At start of turn, grants Spd+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 2);
        }
    },
    "Hone Spd 2": {
        description: "At start of turn, grants Spd+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 3);
        }
    },
    "Hone Spd 3": {
        description: "At start of turn, grants Spd+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 4);
        }
    },
    "Hone Cavalry": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent cavalry allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onTurnStart(battleState) {
            mapBuffByMovementType(this, battleState, "cavalry", {
                atk: 6,
                spd: 6
            });
        },
    },
    "Hone Fliers": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent flying allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["flier"],
        onTurnStart(battleState) {
            mapBuffByMovementType(this, battleState, "flier", {
                atk: 6,
                spd: 6
            });
        },
    },
    "Fortify Def 1": {
        description: "At start of turn, grants Def+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 2
                    });
                }
            }
        },
    },
    "Fortify Def 2": {
        description: "At start of turn, grants Def+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 3
                    });
                }
            }
        },
    },
    "Fortify Def 3": {
        description: "At start of turn, grants Def+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 3
                    });
                }
            }
        },
    },
    "Fortify Res 1": {
        description: "At start of turn, grants Res+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        res: 2
                    });
                }
            }
        },
    },
    "Fortify Res 2": {
        description: "At start of turn, grants Res+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        res: 3
                    });
                }
            }
        },
    },
    "Fortify Res 3": {
        description: "At start of turn, grants Res+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        res: 4
                    });
                }
            }
        },
    },
    "Fortify Armor": {
        description: "At start of turn, grants Def/Res+6 to adjacent armored allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["armored"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "armored" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 6,
                        res: 6
                    });
                }
            }
        },
    },
    "Fortify Cavalry": {
        description: "At start of turn, grants Def/Res+6 to adjacent cavalry allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "cavalry" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 6,
                        res: 6
                    });
                }
            }
        },
    },
    "Fortify Dragons": {
        description: "At start of turn, grants Def/Res+6 to adjacent dragon allies for 1 turn.",
        slot: "C",
        allowedWeaponTypes: ["breath"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("WeaponType").value === "breath" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 6,
                        res: 6
                    });
                }
            }
        },
    },
    "Fortify Fliers": {
        description: "At start of turn, grants Def/Res+6 to adjacent flying allies for 1 turn.",
        allowedMovementTypes: ["flier"],
        slot: "C",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "flier" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 6,
                        res: 6
                    });
                }
            }
        },
    },
    "Goad Fliers": {
        description: "Grants Atk/Spd+4 to flying allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["flier"],
        onCombatAllyStart: goad("flier")
    },
    "Goad Armor": {
        description: "Grants Atk/Spd+4 to armored allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["armored"],
        onCombatAllyStart: goad("armored")
    },
    "Goad Cavalry": {
        description: "Grants Atk/Spd+4 to cavalry allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onCombatAllyStart: goad("cavalry")
    },
    "Ward Cavalry": {
        description: "Grants Def/Res+4 to cavalry allies within 2 spaces during combat.",
        onCombatAllyStart: ward("cavalry"),
        slot: "C",
        allowedMovementTypes: ["cavalry"]
    },
    "Ward Armor": {
        description: "Grants Def/Res+4 to armored allies within 2 spaces during combat.",
        onCombatAllyStart: ward("armored"),
        slot: "C",
        allowedMovementTypes: ["armored"]
    },
    "Ward Fliers": {
        description: "Grants Def/Res+4 to flier allies within 2 spaces during combat.",
        onCombatAllyStart: ward("flier"),
        slot: "C",
        allowedMovementTypes: ["flier"]
    },
    "Panic Ploy 1": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP ≤ unit's HP-5 into penalties through their next actions.",
        slot: "C",
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp <= hp - 5) {
                        enemy.addComponent({
                            type: "Panic"
                        });
                    }
                }
            }
        }
    },
    "Panic Ploy 2": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP ≤ unit's HP-3 into penalties through their next actions.",
        slot: "C",
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp <= hp - 3) {
                        enemy.addComponent({
                            type: "Panic"
                        });
                    }
                }
            }
        }
    },
    "Panic Ploy 3": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP < unit's HP into penalties through their next actions.",
        slot: "C",
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp < hp) {
                        enemy.addComponent({
                            type: "Panic"
                        });
                    }
                }
            }
        }
    },
    "Atk Ploy 1": {
        slot: "C",
        description: "At start of turn, inflicts Atk-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("atk", -3)
    },
    "Atk Ploy 2": {
        slot: "C",
        description: "At start of turn, inflicts Atk-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("atk", -4)
    },
    "Atk Ploy 3": {
        slot: "C",
        description: "At start of turn, inflicts Atk-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("atk", -5)
    },
    "Spd Ploy 1": {
        slot: "C",
        description: "At start of turn, inflicts Spd-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("spd", -3)
    },
    "Spd Ploy 2": {
        slot: "C",
        description: "At start of turn, inflicts Spd-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("spd", -4)
    },
    "Spd Ploy 3": {
        slot: "C",
        description: "At start of turn, inflicts Spd-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("spd", -5)
    },
    "Def Ploy 1": {
        slot: "C",
        description: "At start of turn, inflicts Def-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", -3)
    },
    "Def Ploy 2": {
        slot: "C",
        description: "At start of turn, inflicts Def-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", -4)
    },
    "Def Ploy 3": {
        slot: "C",
        description: "At start of turn, inflicts Def-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", -5)
    },
    "Res Ploy 1": {
        slot: "C",
        description: "At start of turn, inflicts Res-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("res", -3)
    },
    "Res Ploy 2": {
        slot: "C",
        description: "At start of turn, inflicts Res-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("res", -4)
    },
    "Res Ploy 3": {
        slot: "C",
        description: "At start of turn, inflicts Res-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("res", -5)
    },
    "Atk Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Atk+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 2);
        }
    },
    "Atk Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Atk+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 4);
        }
    },
    "Atk Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Atk+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 6);
        }
    },
    "Spd Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Spd+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 2);
        }
    },
    "Spd Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Spd+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 4);
        }
    },
    "Spd Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Spd+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 6);
        }
    },
    "Def Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Def+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 2);
        }
    },
    "Def Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Def+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 4);
        }
    },
    "Def Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Def+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 6);
        }
    },
    "Res Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Res+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 2);
        }
    },
    "Res Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Res+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 4);
        }
    },
    "Res Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Res+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 6);
        }
    },
    "Odd Atk Wave 1": {
        description: "On odd turns, adds +2 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        onTurnStart: wave("atk", turnIsOdd, 2)
    },
    "Odd Atk Wave 2": {
        description: "On odd turns, adds +4 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        onTurnStart: wave("atk", turnIsOdd, 4)
    },
    "Odd Atk Wave 3": {
        description: "On odd turns, adds +6 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        onTurnStart: wave("atk", turnIsOdd, 6)
    },
    "Armor March 1": {
        slot: "C",
        description: "At start of turn, if unit's HP = 100% and unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.)",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (maxHP === hp) {
                let applyBuffToSelf = false;
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                        applyBuffToSelf = true;
                        ally.addComponent({
                            type: "IncreasedMovement"
                        });
                    }
                }

                if (applyBuffToSelf) {
                    this.entity.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }
        }
    },
    "Armor March 2": {
        slot: "C",
        description: "At start of turn, if unit's HP ≥ 50% and unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.) ",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp >= maxHP / 2) {
                let applyBuffToSelf = false;
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                        applyBuffToSelf = true;
                        ally.addComponent({
                            type: "IncreasedMovement"
                        });
                    }
                }

                if (applyBuffToSelf) {
                    this.entity.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }
        }
    },
    "Armor March 3": {
        slot: "C",
        description: "At start of turn, if unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.)",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            let applyBuffToSelf = false;
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                    applyBuffToSelf = true;
                    ally.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }

            if (applyBuffToSelf) {
                this.entity.addComponent({
                    type: "IncreasedMovement"
                });
            }
        }
    },
    "Drive Def 1": {
        slot: "C",
        description: "Grants Def+2 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                def: 2,
            });
        }
    },
    "Drive Def 2": {
        slot: "C",
        description: "Grants Def+3 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                def: 3,
            });
        }
    },
    "Drive Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                atk: 2
            });
        }
    },
    "Drive Atk 2": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                atk: 3
            });
        },
        slot: "C",
        description: "Grants Atk+3 to allies within 2 spaces during combat.",
    },
    "Drive Res 1": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                res: 2
            });
        },
        slot: "C",
        description: "Grants Res+2 to allies within 2 spaces during combat."
    },
    "Drive Res 2": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                res: 3
            });
        },
        slot: "C",
        description: "Grants Res+3 to allies within 2 spaces during combat."
    },
    "Spur Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 2
            });
        }
    },
    "Spur Atk 2": {
        slot: "C",
        description: "Grants Atk+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 3
            });
        }
    },
    "Spur Atk 3": {
        slot: "C",
        description: "Grants Atk+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 4
            });
        }
    },
    "Spur Res 1": {
        slot: "C",
        description: "Grants Res+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 2
            });
        }
    },
    "Spur Res 2": {
        slot: "C",
        description: "Grants Res+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 3
            });
        }
    },
    "Spur Res 3": {
        slot: "C",
        description: "Grants Res+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 4
            });
        }
    },
    "Spur Def 1": {
        slot: "C",
        description: "Grants Def+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 2,
            });
        }
    },
    "Spur Def 2": {
        slot: "C",
        description: "Grants Def+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 3,
            });
        }
    },
    "Spur Def 3": {
        slot: "C",
        description: "Grants Def+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 4,
            });
        }
    },
    "Spur Spd 1": {
        slot: "C",
        description: "Grants Spd+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                spd: 2
            });
        }
    },
    "Spur Spd 2": {
        slot: "C",
        description: "Grants Spd+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                spd: 3,
            });
        }
    },
    "Spur Spd 3": {
        slot: "C",
        description: "Grants Spd+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 4
                });
            }
        }
    },
    "Spur Def/Res 1": {
        description: "Grants Def/Res +2 to adjacent allies during combat.",
        slot: "C",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 2,
                res: 2
            });
        },
    },
    "Spur Def/Res 2": {
        description: "Grants Def/Res +3 to adjacent allies during combat.",
        slot: "C",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 3,
                res: 3
            });
        },
    },
    "Infantry Pulse 1": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit's HP-5. (Stacks with similar skills.)",
        slot: "C",
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 5) {
                        ally.addComponent({
                            type: "AccelerateSpecial"
                        });
                    }
                }
            }
        },
    },
    "Infantry Pulse 2": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit’s HP-3. (Stacks with similar skills.)",
        slot: "C",
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 3) {
                        ally.addComponent({
                            type: "AccelerateSpecial"
                        });
                    }
                }
            }
        },
    },
    "Infantry Pulse 3": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit's HP-5. (Stacks with similar skills.)",
        slot: "C",
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 5) {
                        ally.addComponent({
                            type: "AccelerateSpecial"
                        });
                    }
                }
            }
        },
    },
    "Threaten Atk 1": {
        description: "At start of turn, inflicts Atk-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { atk: -3 });
        }
    },
    "Threaten Atk 2": {
        description: "At start of turn, inflicts Atk-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { atk: -5 });
        }
    },
    "Threaten Atk 3": {
        description: "At start of turn, inflicts Atk-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { atk: -7 });
        }
    },
    "Threaten Def 1": {
        description: "At start of turn, inflicts Def-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { def: -3 });
        }
    },
    "Threaten Def 2": {
        description: "At start of turn, inflicts Def-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { def: -5 });
        }
    },
    "Threaten Def 3": {
        description: "At start of turn, inflicts Def-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { def: -7 });
        }
    },
    "Threaten Spd 1": {
        description: "At start of turn, inflicts Spd-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { spd: -3 });
        }
    },
    "Threaten Spd 2": {
        description: "At start of turn, inflicts Spd-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { spd: -5 });
        }
    },
    "Threaten Spd 3": {
        description: "At start of turn, inflicts Spd-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { spd: -7 });
        }
    },
    "Threaten Res 1": {
        description: "At start of turn, inflicts Res-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { res: -3 });
        }
    },
    "Threaten Res 2": {
        description: "At start of turn, inflicts Res-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { res: -5 });
        }
    },
    "Threaten Res 3": {
        description: "At start of turn, inflicts Res-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { res: -7 });
        }
    },
    "Atk Smoke 1": {
        description: "Inflicts Atk-3 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -3
                    });
                }
            }
        },
    },
    "Atk Smoke 2": {
        description: "Inflicts Atk-5 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -5
                    });
                }
            }
        },
    },
    "Atk Smoke 3": {
        description: "Inflicts Atk-7 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -7
                    });
                }
            }
        },
    },
    "Spd Smoke 1": {
        description: "Inflicts Spd-3 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -3
                    });
                }
            }
        },
    },
    "Spd Smoke 2": {
        description: "Inflicts Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -5
                    });
                }
            }
        },
    },
    "Spd Smoke 3": {
        description: "Inflicts Spd-7 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -7
                    });
                }
            }
        },
    },
    "Spur Spd/Def 1": {
        slot: "C",
        description: "Grants Spd/Def+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 2,
                    def: 2
                });
            }
        }
    },
    "Spur Spd/Def 2": {
        slot: "C",
        description: "Grants Spd/Def+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 3,
                    def: 3
                });
            }
        }
    },
    "Watersweep 1": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit’s Spd ≥ foe’s Spd+5 and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup"
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 5 && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Watersweep 2": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit’s Spd ≥ foe’s Spd+3 and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowUp",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 3 && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Watersweep 3": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit’s Spd > foe’s Spd and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowUp",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd > enemySpd && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    }
};

export default PASSIVES;
