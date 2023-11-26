import { Component } from "ape-ecs";
import { WeaponType as TSWeaponType } from "../weapon";

export default class WeaponType extends Component {
    static properties = {
        weaponType: "sword",
        range: 0,
        useMagic: false,
    } as {
        weaponType: TSWeaponType,
        range: number,
        useMagic?: boolean
    };
};
