import { Component, Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import { MovementType, Stat, Stats } from "../types";
import { WeaponType } from "../weapon";

interface PassivesDict {
    [k: string]: {
        description: string;
        slot: string;
        allowedMovementTypes?: (MovementType | WeaponType)[];
        allowedWeaponTypes?: (MovementType | WeaponType)[];
        protects?: (MovementType | WeaponType)[];
        onCombatStart?(...args: any[]): any;
        onEquip?(...args: any[]): any;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): any;
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

function ploy(affectedStat: Stat, resDifference: number, debuff: number) {
    return function ployLevel(state: GameState) {
        const { x, y } = this.entity.getOne("Position");
        const enemies = getEnemies(state, this.entity);
        for (let enemy of enemies) {
            const enemyPos = enemy.getOne("Position");
            const isCardinal = x === enemyPos.x || y === enemyPos.y;
            const resIsHigher = this.entity.getOne("Stats").res > enemy.getOne("Stats").res + resDifference;
            if (isCardinal && resIsHigher) {
                enemy.addComponent({
                    type: "MapDebuff",
                    [affectedStat]: debuff
                });
            }
        }
    }
}

const PASSIVES: PassivesDict = {
    "Panic Ploy 3": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP < unit's HP into penalties through their next actions.",
        slot: "C",
        onTurnStart(state) {
            const team = this.entity.getOne("Side").value;
            const otherTeam = team === "team1" ? state.teams.team2 : state.teams.team1;
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
    "Odd Atk Wave 3": {
        description: "On odd turns, adds +6 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            if (state.turn % 2) {
                this.entity.addComponent({
                    type: "MapBuff",
                    atk: 6
                });
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "MapBuff",
                            atk: 6
                        });
                    }
                }
            }
        }
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
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 2
                });
            }
        },
    },
    "Drive Def 2": {
        slot: "C",
        description: "Grants Def+3 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    def: 3
                });
            }
        },
    },
    "Drive Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 2
                });
            }
        },
    },
    "Drive Atk 2": {
        slot: "C",
        description: "Grants Atk+3 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 3
                });
            }
        },
    },
    "Def Ploy 1": {
        slot: "C",
        description: "At start of turn, inflicts Def-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", 0, -3)
    },
    "Def Ploy 2": {
        slot: "C",
        description: "At start of turn, inflicts Def-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", 0, -4)
    },
    "Def Ploy 3": {
        slot: "C",
        description: "At start of turn, inflicts Def-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart: ploy("def", 0, -5)
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
