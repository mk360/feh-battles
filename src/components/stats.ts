import { Component } from "ape-ecs";

/**
 * Hero's current Stats.
 */
export default class Stats extends Component {
};

Stats.properties = {
    maxHP: 0,
    hp: 0,
    atk: 0,
    spd: 0,
    def: 0,
    res: 0,
};

// @ts-ignore
Stats.changeEvents = true;
