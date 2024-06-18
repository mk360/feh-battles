import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";

function getComparedStat(unit: Entity, stat: Exclude<keyof Stats, "hp">) {

};

export default getComparedStat;
