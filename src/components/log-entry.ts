import { Component, EntityRef, } from "ape-ecs";

let statsTemplate = {
    atk: 0,
    spd: 0,
    def: 0,
    res: 0,
}

/**
 * Entry that gets added to the history. Tracks component changes, where they originate from, and who do they benefit.
 */
class LogEntry extends Component {
    static properties = {
        /* common properties */
        component: "",
        sourceSkill: "",
        sourceEntity: EntityRef,
        targetEntity: EntityRef,
        logType: "",
        /* map debuffs */
        debuffs: statsTemplate,
        /* map buffs*/
        bonuses: statsTemplate,
        /* combat debuffs */
        penalties: statsTemplate,
        /* combat buffs*/
        buffs: statsTemplate,
        /* combat */
        rounds: [],
        attacker: {
            id: "",
            damage: 0,
            mods: [],
        },
        defender: {
            id: "",
            mods: [],
        },
        /* map damage */
        damage: 0,
        /* map heal */
        heal: 0,
    }
};

export default LogEntry;
