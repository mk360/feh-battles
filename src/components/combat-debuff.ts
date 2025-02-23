import { Component } from "ape-ecs";

/**
 * Stackable stat debuffs that apply for a combat
 */
export default class CombatDebuff extends Component { };

CombatDebuff.properties = {
    atk: 0,
    spd: 0,
    def: 0,
    res: 0
};
