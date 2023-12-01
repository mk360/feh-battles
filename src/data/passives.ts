import { Component, Entity } from "ape-ecs";
import Skill from "../components/skill";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";

interface PassivesDict {
    [k: string]: {
        description: string;
        slot: string;
        allowedMovementTypes?: string[];
        allowedWeaponTypes?: string[];
        onCombatStart?(...args: any[]): any;
        onDamageReceived?(...args: any[]): any;
        onEquip?(...args: any[]): any;
        onAllyCombatStart?(...args: any[]): any;
        onTurnStart?(this: Skill, combatState: GameState): void;
    }
}

function getAllies(state: GameState, hero: Entity) {
    return (state.teams[hero.getOne("Side").value] as Entity[]).filter(i => i.id !== hero.id);
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
                    const { hp: enemyHp } =enemy.getOne("Stats");
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
            const { maxHP, hp } = this.entity.getOne("Stats");
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
    "Spur Atk 1": {
        slot: "C",
        description: "Grants Atk+2 to adjacent allies during combat.",
        onAllyCombatStart() {

        }
    },
};

export default PASSIVES;
