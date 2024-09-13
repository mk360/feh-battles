import { Entity } from "ape-ecs";

/**
 * Shorthand function to get an entity's position if they're attacking or defending.
 */
function getPosition(entity: Entity) {
    return entity.getOne("TemporaryPosition") ?? entity.getOne("Position");
};

export default getPosition;
