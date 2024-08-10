import { Entity } from "ape-ecs";

function getPosition(entity: Entity) {
    return entity.getOne("TemporaryPosition") ?? entity.getOne("Position");
};

export default getPosition;
