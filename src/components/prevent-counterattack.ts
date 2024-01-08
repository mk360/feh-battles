import { Component } from "ape-ecs";

/**
 * If attacker prevents a defender from counterattacking, assign this component to the attacker.
 */
class PreventCounterattack extends Component { };

export default PreventCounterattack;
