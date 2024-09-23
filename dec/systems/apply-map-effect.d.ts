import { Entity } from "ape-ecs";
import { Stats } from "../interfaces/types";
import { STATUSES } from "../statuses";
type WithSource<Status extends typeof STATUSES[number], T = {}> = {
    status: Status;
} & T;
interface MapComponentsDict {
    MapBuff: WithSource<"Bonus", Stats>;
    MapDebuff: WithSource<"Penalty", Stats>;
    Panic: WithSource<"Panic">;
    Gravity: WithSource<"Gravity">;
    Guidance: WithSource<"Guidance">;
    IncreasedMovement: WithSource<"Increased Movement">;
    Guard: WithSource<"Guard">;
    PreventCounterattack: WithSource<"Prevent Counterattack">;
}
/**
 * On target, adds:
 * - A `Status` component. This is required in order to specify the source (who created this status).
 * - A status tag, which will be parsed by the UI to display the correct Status.
 * - A component whose type is the status (ex. `type: MapBuff`), which allows for more targeted
 * statuses (with extra values where needed)
 */
export default function applyMapComponent<K extends keyof MapComponentsDict>(target: Entity, component: K, extraValues: Omit<MapComponentsDict[K], "status">, source?: Entity): void;
export {};
//# sourceMappingURL=apply-map-effect.d.ts.map