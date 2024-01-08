import { Component } from "ape-ecs";

class AfterCombatBuff extends Component {
    static properties = {
        atk: 0,
        spd: 0,
        def: 0,
        res: 0
    }
};

export default AfterCombatBuff;
