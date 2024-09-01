import { Entity } from "ape-ecs";

export function getUnitsWithHighestValue(list: Entity[], extractor: (unit: Entity) => number) {
    let entityList: Entity[] = [];
    let tempThreshold = 0;

    for (let entity of list) {
        const value = extractor(entity);
        if (value > tempThreshold) {
            entityList = [entity];
            tempThreshold = value;
        } else if (value === tempThreshold) {
            entityList.push(entity);
        }
    }

    return entityList;
};

export function getUnitsWithLowestValue(list: Entity[], extractor: (unit: Entity) => number) {
    let entityList: Entity[] = [];
    let tempThreshold = 999;

    for (let entity of list) {
        const value = extractor(entity);
        if (value < tempThreshold) {
            entityList = [entity];
            tempThreshold = value;
        } else if (value === tempThreshold) {
            entityList.push(entity);
        }
    }

    return entityList;
};

export function getUnitsLowerThanOrEqualingValue(list: Entity[], extractor: (unit: Entity) => number, threshold: number) {
    let entityList: Entity[] = [];

    for (let entity of list) {
        const value = extractor(entity);
        if (value <= threshold) {
            entityList.push(entity);
        }
    }

    return entityList;
};

export function getUnitsMatchingValue(list: Entity[], valueToMatch: number, extractor: (unit: Entity) => number) {
    let entityList: Entity[] = [];

    for (let entity of list) {
        const value = extractor(entity);
        if (value === valueToMatch) {
            entityList.push(entity);
        }
    }

    return entityList;
};
