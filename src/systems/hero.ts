import { Entity, System } from "ape-ecs";

class HeroSystem extends System {
    static getDistance(hero1: Entity, hero2: Entity) {
        const pos1 = hero1.getOne("Position");
        const pos2 = hero2.getOne("Position");

        return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
    }
};

export default HeroSystem;
