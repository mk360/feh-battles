import { Component } from "ape-ecs";

/**
 * Hero merge count (0 to 10)
 */
class HeroMerge extends Component {
    static properties = {
        value: 0
    }
};

export default HeroMerge;
