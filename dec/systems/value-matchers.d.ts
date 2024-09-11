import { Entity } from "ape-ecs";
export declare function getUnitsWithHighestValue(list: Entity[], extractor: (unit: Entity) => number): Entity[];
export declare function getUnitsWithLowestValue(list: Entity[], extractor: (unit: Entity) => number): Entity[];
export declare function getUnitsLowerThanOrEqualingValue(list: Entity[], extractor: (unit: Entity) => number, threshold: number): Entity[];
export declare function getUnitsMatchingValue(list: Entity[], valueToMatch: number, extractor: (unit: Entity) => number): Entity[];
//# sourceMappingURL=value-matchers.d.ts.map