import { Component, Entity } from "ape-ecs";
import Skill from "../components/skill";
import PassiveSkill from "../passive_skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
import { WeaponType } from "../weapon";

interface PassivesDict {
    [k: string]: {
        description: string;
        slot: PassiveSkill["slot"];
        allowedMovementTypes?: MovementType[];
        allowedWeaponTypes?: WeaponType[];
        protects?: (MovementType | WeaponType)[];
        onCombatStart?(...args: any[]): any;
        onEquip?(...args: any[]): any;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatAfter?(this: Skill, state: GameState, target: Entity): void;
        onTurnStart?(this: Skill, battleState: GameState): void;
    }
}

function getAllies(state: GameState, hero: Entity) {
    return (state.teams[hero.getOne("Side").value] as Entity[]).filter(i => i.id !== hero.id);
}

function getEnemies(state: GameState, hero: Entity) {
    const { value } = hero.getOne("Side");
    const otherSide = value === "team1" ? "team2" : "team1";
    return state.teams[otherSide];
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
    return turnCount % 2 === 1;
}

function turnIsEven(turnCount: number) {
    return turnCount % 2 === 0;
}

function drive(affectedStat: Stat, buff: number) {
    return function (this: Skill, state: GameState, ally: Entity) {
        if (HeroSystem.getDistance(ally, this.entity) <= 2) {
            ally.addComponent({
                type: "CombatBuff",
                [affectedStat]: buff
            });
        }
    }
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

function honeStat(stat: Stat, buff: number) {
    return function (this: Skill, state: GameState) {
        const allies = getAllies(state, this.entity);
        for (let ally of allies) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "MapBuff",
                    [stat]: buff
                });
            }
        }
    }
}

const PASSIVES: PassivesDict = {
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
        onTurnStart: honeStat("atk", 2),
    },
    "Hone Atk 2": {
        description: "At start of turn, grants Atk+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("atk", 3),
    },
    "Hone Atk 3": {
        description: "At start of turn, grants Atk+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("atk", 4),
    },
    "Hone Atk 4": {
        description: "At start of turn, grants Atk+7 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("atk", 7),
    },
    "Hone Spd 1": {
        description: "At start of turn, grants Spd+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("spd", 2),
    },
    "Hone Spd 2": {
        description: "At start of turn, grants Spd+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("spd", 3),
    },
    "Hone Spd 3": {
        description: "At start of turn, grants Spd+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart: honeStat("spd", 4),
    },
    "Hone Cavalry": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent cavalry allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "cavalry") {
                    ally.addComponent({
                        type: "MapBuff",
                        atk: 6,
                        spd: 6
                    });
                }
            }
        },
    },
    "Hone Fliers": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent flying allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["flier"],
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "flier") {
                    ally.addComponent({
                        type: "MapBuff",
                        atk: 6,
                        spd: 6
                    });
                }
            }
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
        onCombatAllyStart: drive("def", 2)
    },
    "Drive Def 2": {
        slot: "C",
        description: "Grants Def+3 to allies within 2 spaces during combat.",
        onCombatAllyStart: drive("def", 3)
    },
    "Drive Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to allies within 2 spaces during combat.",
        onCombatAllyStart: drive("atk", 2)
    },
    "Drive Atk 2": {
        onCombatAllyStart: drive("atk", 3),
        slot: "C",
        description: "Grants Atk+3 to allies within 2 spaces during combat.",
    },
    "Drive Res 1": {
        onCombatAllyStart: drive("res", 2),
        slot: "C",
        description: "Grants Res+2 to allies within 2 spaces during combat."
    },
    "Drive Res 2": {
        onCombatAllyStart: drive("res", 3),
        slot: "C",
        description: "Grants Res+3 to allies within 2 spaces during combat."
    },
    "Spur Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 2
                });
            }
        }
    },
    "Spur Atk 2": {
        slot: "C",
        description: "Grants Atk+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 3
                });
            }
        }
    },
    "Spur Atk 3": {
        slot: "C",
        description: "Grants Atk+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 4
                });
            }
        }
    },
    "Spur Res 1": {
        slot: "C",
        description: "Grants Res+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    res: 2
                });
            }
        }
    },
    "Spur Res 2": {
        slot: "C",
        description: "Grants Res+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    res: 3
                });
            }
        }
    },
    "Spur Res 3": {
        slot: "C",
        description: "Grants Res+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    res: 4
                });
            }
        }
    },
    "Spur Def 1": {
        slot: "C",
        description: "Grants Def+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 2
                });
            }
        }
    },
    "Spur Def 2": {
        slot: "C",
        description: "Grants Def+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 3
                });
            }
        }
    },
    "Spur Def 3": {
        slot: "C",
        description: "Grants Def+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 4
                });
            }
        }
    },
    "Spur Spd 1": {
        slot: "C",
        description: "Grants Spd+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 2
                });
            }
        }
    },
    "Spur Spd 2": {
        slot: "C",
        description: "Grants Spd+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 3
                });
            }
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
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 2,
                    res: 2
                });
            }
        },
    },
    "Spur Def/Res 2": {
        description: "Grants Def/Res +3 to adjacent allies during combat.",
        slot: "C",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 3,
                    res: 3
                });
            }
        },
    }
};

export default PASSIVES;
