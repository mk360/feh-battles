import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import PassiveSkill from "../passive_skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
import { WeaponColor, WeaponType } from "../weapon";
import getAllies from "../utils/get-alies";
import getEnemies from "../utils/get-enemies";
import { mapBuffByMovementType, honeStat, combatBuffByRange, defiant, breaker, elementalBoost, renewal } from "./effects";
import Characters from "./characters.json";

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
        onEquip?(this: Skill, ...args: any[]): any;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatAfter?(this: Skill, state: GameState, target: Entity): void;
        onTurnStart?(this: Skill, state: GameState): void;
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

function tactic(affectedStat: Stat, buff: number) {
    return function (this: Skill, state: GameState) {
        const movementTypeMap: {
            [k in MovementType]: 0
        } = {
            "armored": 0,
            "cavalry": 0,
            "flier": 0,
            "infantry": 0
        };
        const userMovementType = this.entity.getOne("MovementType").value;
        movementTypeMap[userMovementType]++;

        const allies = getAllies(state, this.entity);

        for (let ally of allies) {
            const allyMovementType = ally.getOne("MovementType").value;
            movementTypeMap[allyMovementType]++;
        }

        if (movementTypeMap[userMovementType] <= 2) {
            this.entity.addComponent({
                type: "MapBuff",
                [affectedStat]: buff
            });
        }

        for (let ally of allies) {
            const allyMovementType = ally.getOne("MovementType").value;
            if (allyMovementType <= 2) {
                ally.addComponent({
                    type: "MapBuff",
                    [affectedStat]: buff
                });
            }
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

function threaten(statDebuffs: Stats) {
    return function (this: Skill, state: GameState) {
        const enemies = getEnemies(state, this.entity);
        for (let enemy of enemies) {
            if (HeroSystem.getDistance(enemy, this.entity) <= 2) {
                enemy.addComponent({
                    type: "MapDebuff",
                    ...statDebuffs
                });
            }
        }
    }
}

const PASSIVES: PassivesDict = {
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
            renewal(this, state.turn, (count) => count % 4 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 2": {
        description: "At the start of every third turn, restores 10 HP.",
        onTurnStart(state) {
            renewal(this, state.turn, (count) => count % 3 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 3": {
        description: "At start of odd-numbered turns, restores 10 HP.",
        onTurnStart(state) {
            renewal(this, state.turn, turnIsOdd, 10);
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
        onTurnStart: tactic("atk", 2),
    },
    "Atk Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Atk+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("atk", 4),
    },
    "Atk Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Atk+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("atk", 6),
    },
    "Spd Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Spd+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("spd", 2),
    },
    "Spd Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Spd+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("spd", 4),
    },
    "Spd Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Spd+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("spd", 6),
    },
    "Def Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Def+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("def", 2),
    },
    "Def Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Def+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("def", 4),
    },
    "Def Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Def+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("def", 6),
    },
    "Res Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Res+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("res", 2),
    },
    "Res Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Res+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("res", 4),
    },
    "Res Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Res+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart: tactic("res", 6),
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
        onTurnStart: threaten({ atk: -3 })
    },
    "Threaten Atk 2": {
        description: "At start of turn, inflicts Atk-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ atk: -5 })
    },
    "Threaten Atk 3": {
        description: "At start of turn, inflicts Atk-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ atk: -7 })
    },
    "Threaten Def 1": {
        description: "At start of turn, inflicts Def-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ def: -3 })
    },
    "Threaten Def 2": {
        description: "At start of turn, inflicts Def-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ def: -5 })
    },
    "Threaten Def 3": {
        description: "At start of turn, inflicts Def-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ def: -7 })
    },
    "Threaten Spd 1": {
        description: "At start of turn, inflicts Spd-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ spd: -3 })
    },
    "Threaten Spd 2": {
        description: "At start of turn, inflicts Spd-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ spd: -5 })
    },
    "Threaten Spd 3": {
        description: "At start of turn, inflicts Spd-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ spd: -7 })
    },
    "Threaten Res 1": {
        description: "At start of turn, inflicts Res-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ res: -3 })
    },
    "Threaten Res 2": {
        description: "At start of turn, inflicts Res-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ res: -5 })
    },
    "Threaten Res 3": {
        description: "At start of turn, inflicts Res-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart: threaten({ res: -7 })
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
};

export default PASSIVES;
