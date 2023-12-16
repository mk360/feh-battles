import { Component } from "ape-ecs";

class DamageReduction extends Component {
    static properties = {
        amount: 0,
        /**
         * Subtractive percentage: if a skill reduces damage by 70%, set property to 0.7
         *
         */
        percentage: 0,
        source: ""
    }
};

export default DamageReduction;
