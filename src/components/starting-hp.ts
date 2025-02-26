import { Component } from "ape-ecs";

/**
 * Hero's HP at the start of a combat.
 */
class StartingHP extends Component {
    static properties = {
        value: 0
    }
};

export default StartingHP;
