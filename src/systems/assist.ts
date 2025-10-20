import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import ASSISTS from "../data/assists";
import addLogEntry from "../utils/log-entries/add-log-entry";

const SUBSCRIBED_COMPONENTS = ["MapBuff", "MapDebuff", "Stats", "PreviewHP", "SacrificeHP", "Refresh", "Swap", "Reposition", "Pivot", "Move", "Status", "Shove", "Heal", "DrawBack"];

class AssistSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().fromAny("Assisting", "Assisted", "PreviewAssist");
        for (let component of SUBSCRIBED_COMPONENTS) {
            this.subscribe(component);
        }
    }

    update(): void {
        const [assisting, assisted] = this.query.refresh().execute();
        const assistSkill = assisting.getOne("Assist");
        if (assistSkill) {
            const assistData = ASSISTS[assistSkill.name];
            // todo pour plus tard : ajouter des "onAssist" aux skills qui s'activent après un assist (pour les trucs du genre Snare, le B de Mordecai, etc.)
            const components = assistData.onApply.call(assistSkill, this.state, assisted);
            if (components) {
                for (let addedComponent of components) {
                    if (assisting.getOne("PreviewAssist")) {
                        console.log("assist preview", addedComponent.type);
                    } else {
                        console.log("assist run", addedComponent.type);
                    }
                    addLogEntry(addedComponent, assisting, assisted, assistSkill.name, this.state.history, !!assisting.getOne("PreviewAssist"));
                }
            } else {
                console.warn("No components found for " + assistSkill.name);
            }
            const newAssistingHealth = getNewHealth(assisting);
            const newAssistedHealth = getNewHealth(assisted);
            if (assisting.getOne("PreviewAssist")) {
                assisting.addComponent({
                    type: "PreviewHP",
                    value: newAssistingHealth,
                });

                assisted.addComponent({
                    type: "PreviewHP",
                    value: newAssistedHealth,
                });
            } else {
                this.world.runSystems("move");
                this.world.runSystems("after-assist");
            }
        }
    }
};

function getNewHealth(entity: Entity) {
    let { hp: baseHP, maxHP } = entity.getOne("Stats");
    const sacrificedHP = entity.getComponents("SacrificeHP");
    const restoredHP = entity.getComponents("Heal");
    sacrificedHP.forEach((sacrifice) => {
        baseHP = Math.max(1, baseHP - sacrifice.value);
    });

    restoredHP.forEach((restoration) => {
        baseHP = Math.min(maxHP, baseHP + restoration.value);
    });

    return baseHP;
};

export default AssistSystem;
