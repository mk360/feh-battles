import { Component } from "ape-ecs";

/**
 * Guarantee that the Hero survives with 1 HP if dealt a lethal blow.
 */
class ForceSurvival extends Component {
    static properties = {
        source: ""
    };
};

export default ForceSurvival;
