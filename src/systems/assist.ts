import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import ASSISTS from "../data/assists";

const SUBSCRIBED_COMPONENTS = ["MapBuff", "MapDebuff", "Stats", "PreviewHP", "Position", "Move", "SacrificeHP"];

class AssistSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().fromAny("Assisting", "PreviewAssist");
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
            assistData.onApply.call(assistSkill, this.state, assisted);
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
                this.world.runSystems("hp-mod");
                this.world.runSystems("move");
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
