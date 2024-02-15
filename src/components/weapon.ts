import { Component } from "ape-ecs";

export default class Weapon extends Component {
    static properties = {
        weaponType: "",
        range: 0,
        might: 0,
        color: "",
        useMagic: false,
    };

    static serializeFields = ["weaponType", "color"]
};
