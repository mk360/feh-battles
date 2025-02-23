import { Component } from "ape-ecs";

/**
 * Tiles where a hero can apply an Assist
 */
class AssistTile extends Component {
    static properties = {
        x: 0,
        y: 0
    }
};

export default AssistTile;
