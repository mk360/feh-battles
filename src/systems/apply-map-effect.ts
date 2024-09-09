import { Entity, IComponentConfig } from "ape-ecs";
import { Stats } from "../interfaces/types";
import { STATUSES } from "../statuses";

type WithSource<Status extends typeof STATUSES[number], T = {}> = { status: Status } & T;

interface MapComponentsDict {
    MapBuff: WithSource<"Bonus", Stats>;
    MapDebuff: WithSource<"Penalty", Stats>;
    Panic: WithSource<"Panic">;
    Gravity: WithSource<"Gravity">;
    Guidance: WithSource<"Guidance">;
    IncreasedMovement: WithSource<"Increased Movement">;
    Guard: WithSource<"Guard">;
}

const StatusesDict: {
    [k in keyof MapComponentsDict]: MapComponentsDict[k]["status"]
} = {
    "Gravity": "Gravity",
    Guard: "Guard",
    MapBuff: "Bonus",
    MapDebuff: "Penalty",
    IncreasedMovement: "Increased Movement",
    Guidance: "Guidance",
    Panic: "Panic"
}

export default function applyMapComponent<K extends keyof MapComponentsDict>(target: Entity, component: K, extraValues: Omit<MapComponentsDict[K], "status">, source?: Entity) {
    const componentCreationPayload: IComponentConfig = {
        type: "Status",
        value: component,
    };

    target.addComponent({
        type: component,
        ...extraValues
    });

    if (source) {
        componentCreationPayload.source = source;
    }

    const status = StatusesDict[component];

    target.addComponent(componentCreationPayload);

    target.addTag(status);
}
