import { Component } from "ape-ecs";

/**
 * This Hero has survived a lethal blow but can't activate the effect again.
 */
class ForcedSurvival extends Component {
    static properties = {
        source: ""
    };
};

export default ForcedSurvival;
