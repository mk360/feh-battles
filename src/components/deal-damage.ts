import { Component, EntityRef } from "ape-ecs";

class DealDamage extends Component {
    static properties = {
        damage: 0,
        turnIndex: 0,
        special: false,
        cooldown: 0,
        heal: 0,
        target: EntityRef,
        targetTriggersSpecial: false,
        targetHP: 0,
        targetCooldown: 0,
    };
};

export default DealDamage;
