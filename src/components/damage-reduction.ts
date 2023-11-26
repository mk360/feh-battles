import { Component } from "ape-ecs";

class DamageReduction extends Component {
    static properties = {
        amount: 0,
        percentage: 0
    }
};

export default DamageReduction;
