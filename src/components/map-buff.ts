import { Component } from "ape-ecs";

class MapBuff extends Component { };

// todo : le renommer peut-être en "MapMod" ou "StatMod"
// peut-être restructurer le composant en :
// {
//     [stat]: {
//         buff: 5,
//         debuff: 4
//     }
// }

MapBuff.properties = {
    atk: 0,
    spd: 0,
    def: 0,
    res: 0
};

export default MapBuff;
