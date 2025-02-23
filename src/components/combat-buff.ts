import { Component } from "ape-ecs";

/**
 * Stackable stat buffs that apply for a combat
 */
export default class CombatBuff extends Component { };

CombatBuff.properties = {
    atk: 0,
    spd: 0,
    def: 0,
    res: 0
};
