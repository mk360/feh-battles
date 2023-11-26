import { Component } from "ape-ecs";

class MapBuff extends Component { };

MapBuff.properties = {
    atk: 0,
    spd: 0,
    def: 0,
    res: 0
};

export default MapBuff;
