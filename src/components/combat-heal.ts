import { Component } from "ape-ecs";

class CombatHeal extends Component {
    static properties = {
        amount: 0,
        percentage: 0
    }
};

export default CombatHeal;
