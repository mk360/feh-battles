import { Component, EntityRef } from "ape-ecs";

class Wieldable extends Component {};

Wieldable.properties = {
    wielder: EntityRef
};

export default Wieldable;

