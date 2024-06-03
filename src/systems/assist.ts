import { Entity, Query, System } from "ape-ecs";
import GameState from "./state";
import ASSISTS from "../data/assists";

class AssistSystem extends System {
    private state: GameState;
    private query: Query;

    init(state: GameState): void {
        this.state = state;
        this.query = this.createQuery().from("Assisting");
    }

    update(): void {
        const [assisting, assisted] = this.query.execute();
        const baseAssistingHealth = assisting.getOne("Stats").hp;
        const baseAssistedHealth = assisted.getOne("Stats").hp;
        const assistSkill = assisting.getOne("Assist");
        const assistData = ASSISTS[assistSkill.name];
        if (assistSkill && assistData) {
            // todo pour plus tard : ajouter des "onAssist" aux skills (pour les trucs du genre Snare, le B de Mordecai, etc.)
            assistData.onApply.call(assisting, this.state, assisted);
        }
        const newAssistingHealth = getNewHealth(assisting);
        const newAssistedHealth = getNewHealth(assisted);
    }
};

function getNewHealth(entity: Entity) {
    let { hp: baseHP, maxHP } = entity.getOne("Stats").hp;
    const sacrificedHP = entity.getComponents("SacrificeHp");
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
