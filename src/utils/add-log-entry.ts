import { Component, Entity } from "ape-ecs";

// need to split log entries depending on phases, for a more narrow scope and customized behavior
function addLogEntry(component: Component, sourceEntity: Entity, targetEntity: Entity, skillName: string, history: Entity) {
    const properties: { [k: string]: any } = { // temporary
        sourceSkill: skillName,
        component: component.id,
        sourceEntity,
        targetEntity,
        logType: component.type
    };

    const { type, ...props } = component.getObject(false);

    switch (component.type) {
        case "CombatBuff": {
            properties.buffs = props;
            break;
        };

        case "CombatDebuff": {
            properties.debuffs = props;
            break;
        };

        case "MapBuff": {
            properties.bonuses = props;
            break;
        };

        case "MapDebuff": {
            properties.penalties = props;
            break;
        };
    }

    const logEntryComponent = history.addComponent({
        type: "LogEntry",
        ...properties
    });

    return logEntryComponent;
};

export default addLogEntry;
