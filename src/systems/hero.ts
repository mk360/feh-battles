import { Entity, System } from "ape-ecs";
import getPosition from "./get-position";

class HeroSystem extends System {
    static getDistance(hero1: Entity, hero2: Entity) {
        const pos1 = getPosition(hero1);
        const pos2 = getPosition(hero2);

        return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
    }
};

export default HeroSystem;
