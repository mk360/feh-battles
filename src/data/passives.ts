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
        onTurnStart?(this: Skill, combatState: GameState): Component[] | void;
    }
}

const PASSIVES: PassivesDict = {
    "Odd Atk Wave 3": {
        description: "On odd turns, adds +6 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            if (state.turn % 2) {
                this.entity.addComponent({
                    type: "MapBuff",
                    atk: 6
                });
                const allies = (state.teams[this.entity.getOne("Side").value] as Entity[]).filter(i => i.id !== this.entity.id);
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
    }
};

export default PASSIVES;
