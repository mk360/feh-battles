import { Component } from "ape-ecs";

class MapDebuff extends Component {
    static properties = {
        atk: 0,
        def: 0,
        res: 0,
        spd: 0
    }
};

export default MapDebuff;
