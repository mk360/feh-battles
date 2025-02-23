import { Component, EntityRef } from "ape-ecs";

/**
 * Main Component used to report a Combat round outcome
 */
class DealDamage extends Component {
    static properties = {
        round: 0,
        attacker: {
            hp: 0,
            entity: EntityRef,
            heal: 0,
            triggerSpecial: false,
            specialCooldown: 0,
            turn: 0,
            damage: 0,
        },
        target: {
            hp: 0,
            entity: EntityRef,
            heal: 0,
            triggerSpecial: false,
            specialCooldown: 0,
            turn: 0,
            damage: 0,
        },
    };
};

export default DealDamage;
