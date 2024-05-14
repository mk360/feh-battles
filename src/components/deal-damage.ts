import { Component, EntityRef } from "ape-ecs";

class DealDamage extends Component {
    static properties = {
        damage: 0,
        turnIndex: 0,
        target: EntityRef
    };
};

export default DealDamage;
