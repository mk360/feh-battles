import { Component, Entity, IComponentConfig } from "ape-ecs";
import { Stats } from "../interfaces/types";
import { STATUSES } from "../statuses";

type WithSource<Status extends typeof STATUSES[number], T = {}> = { status: Status } & T;

interface MapComponentsDict {
    MapBuff: WithSource<"Bonus", Stats>;
    MapDebuff: WithSource<"Penalty", Stats>;
    GravityComponent: WithSource<"Gravity">;
    Guidance: WithSource<"Guidance">;
    IncreasedMovement: WithSource<"Increased Movement">;
    Guard: WithSource<"Guard">;
    PanicComponent: WithSource<"Panic">;
    PreventCounterattack: WithSource<"Prevent Counterattack">;
}

const StatusesDict: {
    [k in keyof MapComponentsDict]: MapComponentsDict[k]["status"]
} = {
    "GravityComponent": "Gravity",
    Guard: "Guard",
    MapBuff: "Bonus",
    MapDebuff: "Penalty",
    IncreasedMovement: "Increased Movement",
    Guidance: "Guidance",
    PanicComponent: "Panic",
    "PreventCounterattack": "Prevent Counterattack"
}

const ReverseStatusesDict = {
    Gravity: "GravityComponent",
    Guard: "Guard",
    Bonus: "MapBuff",
    Penalty: "MapDebuff",
    "Increased Movement": "IncreasedMovement",
    Guidance: "Guidance",
    Panic: "PanicComponent",
    "Prevent Counterattack": "PreventCounterattack"
};

export function removeStatuses<T extends keyof typeof ReverseStatusesDict>(target: Entity, status: T) {
    target.removeTag(status);
    const componentsToFind = ReverseStatusesDict[status];
    const matchingComponents = target.getComponents(componentsToFind);
    matchingComponents.forEach((comp) => {
        target.removeComponent(comp);
    });
    const statusComponents = target.getComponents("Status");
    statusComponents.forEach((statusComponent) => {
        if (statusComponent.value === status) {
            target.removeComponent(statusComponent);
        }
    })
}

/**
 * On target, adds:
 * - A `Status` component. This is required in order to specify the source (who created this status).
 * - A status tag, which will be parsed by the UI to display the correct Status.
 * - A component whose type is the status (ex. `type: MapBuff`), which allows for more targeted 
 * statuses (with extra values where needed)
 */
export function applyMapComponent<K extends keyof MapComponentsDict>(target: Entity, component: K, extraValues: Omit<MapComponentsDict[K], "status">, source?: Entity) {
    const components: Component[] = [];
    const componentCreationPayload: IComponentConfig = {
        type: "Status",
        value: StatusesDict[component],
    };

    components.push(target.addComponent({
        type: component,
        ...extraValues
    }));

    if (source) {
        componentCreationPayload.source = source;
    }

    const status = StatusesDict[component];

    components.push(target.addComponent(componentCreationPayload));

    target.addTag(status);

    return components;
}
