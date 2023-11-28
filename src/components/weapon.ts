import { Component } from "ape-ecs";

export default class Weapon extends Component {
    static properties = {
        weaponType: "sword",
        range: 0,
        useMagic: false,
    };
};
