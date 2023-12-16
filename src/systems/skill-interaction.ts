import { Component, Query, System } from "ape-ecs";
import Counterattack from "../components/counterattack";
import GuaranteedFollowup from "../components/guaranteed-followup";
import PreventCounterattack from "../components/prevent-counterattack";
import PreventFollowUp from "../components/prevent-followup";
import PreventTargetLowestDefense from "../components/prevent-target-lowest-defense";
import TargetLowestDefense from "../components/target-lowest-defense";
import GameState from "./state";

const NeutralizationMap = new Map<new () => Component, new () => Component>();

NeutralizationMap.set(Counterattack, PreventCounterattack);
NeutralizationMap.set(TargetLowestDefense, PreventTargetLowestDefense);
NeutralizationMap.set(GuaranteedFollowup, PreventFollowUp);

class SkillInteractionSystem extends System {
    private state: GameState;
    private battlingQuery: Query;

    init(state: GameState): void {
        this.state = state;
        this.battlingQuery = this.createQuery().fromAll("Battling");
    }

    update() {
        const [firstHero, secondHero] = this.battlingQuery.execute();

        NeutralizationMap.forEach((defenderComponentLabel, attackerComponentLabel) => {
            const defenderComponents = secondHero.getComponents(defenderComponentLabel);
            defenderComponents.forEach((comp) => {
                const matchingOffensiveComponent = firstHero.getOne(attackerComponentLabel);
                if (comp && matchingOffensiveComponent) {
                    secondHero.removeComponent(comp);
                    firstHero.removeComponent(matchingOffensiveComponent);
                }
            })
        });
    }
};

export default SkillInteractionSystem;
