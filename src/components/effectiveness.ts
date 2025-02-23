import { Component } from "ape-ecs";

/**
 * Effective against the specified Movement Type or Weapon Type
 */
export default class Effectiveness extends Component {
    static properties = {
        value: ""
    };
}