import { Component } from "ape-ecs";
export default class Weapon extends Component {
    static properties: {
        weaponType: string;
        range: number;
        color: string;
        useMagic: boolean;
    };
    static serializeFields: string[];
}
//# sourceMappingURL=weapon.d.ts.map