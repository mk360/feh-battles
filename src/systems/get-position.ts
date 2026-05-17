import { Component, Entity } from "ape-ecs";

interface Position {
    x: 1 | 2 | 3 | 4 | 5 | 6;
    y: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

/**
 * Shorthand function to get an entity's position if they're attacking or defending.
 */
function getPosition(entity: Entity) {
    return (entity.getOne("TemporaryPosition") ?? entity.getOne("Position")) as (Component & Position);
};

export default getPosition;
