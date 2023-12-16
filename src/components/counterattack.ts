import { Component } from "ape-ecs";

/**
 * Assign this component to the defender, since an attacker cannot counterattack.
 */
class Counterattack extends Component { };

export default Counterattack;
