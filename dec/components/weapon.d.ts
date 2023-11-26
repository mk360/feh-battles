import { Component } from "ape-ecs";
import { WeaponType as TSWeaponType } from "../weapon";
export default class WeaponType extends Component {
    static properties: {
        weaponType: TSWeaponType;
        range: number;
        useMagic?: boolean;
    };
}
//# sourceMappingURL=weapon.d.ts.map