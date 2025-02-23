import { Component } from "ape-ecs";

/**
 * Determines the affinity an attacker applies to the defender.
 */
class ApplyAffinity extends Component {
    static properties = {
        value: 0
    };
};

export default ApplyAffinity;
