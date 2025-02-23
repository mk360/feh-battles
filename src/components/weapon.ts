import { Component } from "ape-ecs";

/**
 * Technical properties of the Hero's Weapon.
 */
export default class Weapon extends Component {
    static properties = {
        weaponType: "",
        range: 0,
        might: 0,
        color: "",
        useMagic: false,
    };
};
