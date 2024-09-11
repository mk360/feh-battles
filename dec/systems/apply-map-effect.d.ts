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
export default function applyMapComponent<K extends keyof MapComponentsDict>(target: Entity, component: K, extraValues: Omit<MapComponentsDict[K], "status">, source?: Entity): void;
export {};
//# sourceMappingURL=apply-map-effect.d.ts.map