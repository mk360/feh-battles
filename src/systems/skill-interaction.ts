import { Component, Query, System } from "ape-ecs";
import Counterattack from "../components/counterattack";
import DamageReduction from "../components/damage-reduction";
import GuaranteedFollowup from "../components/guaranteed-followup";
import MapBuff from "../components/map-buff";
import NeutralizeMapBuffs from "../components/neutralize-map-buffs";
import NeutralizeNormalizeStaffDamage from "../components/neutralize-normalize-staff-damage";
import NormalizeStaffDamage from "../components/normalize-staff-damage";
import PreventCounterattack from "../components/prevent-counterattack";
import PreventDamageReduction from "../components/prevent-damage-reduction";
import PreventFollowUp from "../components/prevent-followup";
import PreventTargetLowestDefense from "../components/prevent-target-lowest-defense";
import TargetLowestDefense from "../components/target-lowest-defense";
import GameState from "./state";

const NeutralizationMap = new Map<new () => Component, new () => Component>();

// 1-to-1 neutralizations
NeutralizationMap.set(Counterattack, PreventCounterattack);
NeutralizationMap.set(TargetLowestDefense, PreventTargetLowestDefense);
NeutralizationMap.set(GuaranteedFollowup, PreventFollowUp);
NeutralizationMap.set(NormalizeStaffDamage, NeutralizeNormalizeStaffDamage);

// 1-to-many neutralizations, e.g. one effect is enough to neutralize all target effects
const MultipleNeutralizationsMap = new Map<new () => Component, new () => Component>();

MultipleNeutralizationsMap.set(PreventDamageReduction, DamageReduction);
MultipleNeutralizationsMap.set(NeutralizeMapBuffs, MapBuff);

class SkillInteractionSystem extends System {
    private state: GameState;
    private battlingQuery: Query;

    init(state: GameState): void {
        this.state = state;
        this.battlingQuery = this.createQuery().fromAll("Battling");
    }

    update() {
        const [firstHero, secondHero] = this.battlingQuery.execute();

        NeutralizationMap.forEach((neutralizingComponent, neutralizedComponent) => {
            secondHero.getComponents(neutralizingComponent).forEach((comp) => {
                const matchingOffensiveComponent = firstHero.getOne(neutralizedComponent);
                if (comp && matchingOffensiveComponent) {
                    secondHero.removeComponent(comp);
                    firstHero.removeComponent(matchingOffensiveComponent);
                }
            });

            secondHero.getComponents(neutralizingComponent).forEach((comp) => {
                const matchingDefensiveComponent = secondHero.getOne(neutralizedComponent);
                if (comp && matchingDefensiveComponent) {
                    firstHero.removeComponent(comp);
                    secondHero.removeComponent(matchingDefensiveComponent);
                }
            });
        });

        MultipleNeutralizationsMap.forEach((neutralizedComponent, neutralizer) => {
            const defenderComponent = secondHero.getOne(neutralizer);
            const attackerComponent = firstHero.getOne(neutralizer);

            if (defenderComponent) {
                firstHero.getComponents(neutralizedComponent).forEach((comp) => {
                    firstHero.removeComponent(comp);
                });
                secondHero.removeComponent(defenderComponent);
            }

            if (attackerComponent) {
                secondHero.getComponents(neutralizedComponent).forEach((comp) => {
                    secondHero.removeComponent(comp);
                });
                firstHero.removeComponent(defenderComponent);
            }
        });
    }
};

export default SkillInteractionSystem;
