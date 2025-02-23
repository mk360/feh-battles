import { Component } from "ape-ecs";

/**
 * Prevents Effectiveness effects on the specified Movement Type or Weapon Type.
 */
export default class Immunity extends Component {
    static properties = {
        value: ""
    };
}