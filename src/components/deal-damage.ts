import { Component, EntityRef } from "ape-ecs";

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
