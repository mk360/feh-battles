import { Component, EntityRef } from "ape-ecs";

/**
 * Disable any effect allowing the opponent to make a follow-up, or neutralizes a Guaranteed Follow-up. Add it to the attacking entity.
 */
class PreventFollowup extends Component {
    static properties = {
        target: EntityRef
    }
};

export default PreventFollowup;
