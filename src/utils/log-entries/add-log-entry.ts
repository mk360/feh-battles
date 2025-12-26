import { Component, Entity } from "ape-ecs";

// need to split log entries depending on phases, for a more narrow scope and customized behavior
function addLogEntry(component: Component, sourceEntity: Entity, targetEntity: Entity, skillName: string, history: Entity, preview = false) {
    const properties: { [k: string]: any } = { // temporary
        sourceSkill: skillName,
        sourceEntity,
        targetEntity,
        logType: component.type,
        preview
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

        case "Heal": {
            properties.heal = props.value;
            break;
        }

        case "MapDamage": {
            properties.damage = props.value;
            break;
        }

        case "Status": {
            properties.status = props.value;
            break;
        }

        case "DealDamage": {
            properties.damage = props.attacker.damage;
            properties.damage = props.attacker.damage;
            properties.attacker
            break;
        }
    }

    const logEntryComponent = history.addComponent({
        type: "LogEntry",
        ...properties
    });

    return logEntryComponent;
};

export default addLogEntry;
