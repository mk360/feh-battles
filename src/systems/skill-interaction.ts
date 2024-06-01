import { Component, ComponentClass, Query, System } from "ape-ecs";
import Counterattack from "../components/counterattack";
import DamageReduction from "../components/damage-reduction";
import GuaranteedAffinity from "../components/guaranteed-affinity";
import GuaranteedFollowup from "../components/guaranteed-followup";
import MapBuff from "../components/map-buff";
import NeutralizeAffinity from "../components/neutralize-affinity";
import NeutralizeMapBuffs from "../components/neutralize-map-buffs";
import NeutralizeNormalizeStaffDamage from "../components/neutralize-normalize-staff-damage";
import NormalizeStaffDamage from "../components/normalize-staff-damage";
import PreventCounterattack from "../components/prevent-counterattack";
import PreventDamageReduction from "../components/prevent-damage-reduction";
import PreventFollowUp from "../components/prevent-followup";
import PreventTargetLowestDefense from "../components/prevent-target-lowest-defense";
import TargetLowestDefense from "../components/target-lowest-defense";
import GameState from "./state";
import ApplyAffinity from "../components/apply-affinity";
import SlowSpecial from "../components/slow-special";
import NeutralizeSlowSpecial from "../components/neutralize-slow-special";
import AccelerateSpecial from "../components/accelerate-special";
import NeutralizeAccelerateSpecial from "../components/neutralize-accelerate-special";

const NeutralizationMap = new Map<ComponentClass, ComponentClass>();

// 1-to-1 neutralizations
NeutralizationMap.set(Counterattack, PreventCounterattack);
NeutralizationMap.set(TargetLowestDefense, PreventTargetLowestDefense);
NeutralizationMap.set(GuaranteedFollowup, PreventFollowUp);
NeutralizationMap.set(NormalizeStaffDamage, NeutralizeNormalizeStaffDamage);
NeutralizationMap.set(GuaranteedAffinity, NeutralizeAffinity);
NeutralizationMap.set(ApplyAffinity, NeutralizeAffinity);
NeutralizationMap.set(SlowSpecial, NeutralizeSlowSpecial);
NeutralizationMap.set(AccelerateSpecial, NeutralizeAccelerateSpecial);

// 1-to-many neutralizations, e.g. one effect is enough to neutralize all target effects
const MultipleNeutralizationsMap = new Map<ComponentClass, ComponentClass>();

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
        const [attacker, defender] = this.battlingQuery.refresh().execute();

        NeutralizationMap.forEach((neutralizingComponent, neutralizedComponent) => {
            defender.getComponents(neutralizingComponent).forEach((comp) => {
                const matchingOffensiveComponent = attacker.getOne(neutralizedComponent);
                if (comp && matchingOffensiveComponent) {
                    defender.removeComponent(comp);
                    attacker.removeComponent(matchingOffensiveComponent);
                }
            });

            defender.getComponents(neutralizingComponent).forEach((comp) => {
                const matchingDefensiveComponent = defender.getOne(neutralizedComponent);
                if (comp && matchingDefensiveComponent) {
                    attacker.removeComponent(comp);
                    defender.removeComponent(matchingDefensiveComponent);
                }
            });
        });

        MultipleNeutralizationsMap.forEach((neutralizedComponent, neutralizer) => {
            const defenderComponent = defender.getOne(neutralizer);
            const attackerComponent = attacker.getOne(neutralizer);

            if (defenderComponent) {
                attacker.getComponents(neutralizedComponent).forEach((comp) => {
                    attacker.removeComponent(comp);
                });
                defender.removeComponent(defenderComponent);
            }

            if (attackerComponent) {
                defender.getComponents(neutralizedComponent).forEach((comp) => {
                    defender.removeComponent(comp);
                });
                attacker.removeComponent(defenderComponent);
            }
        });
    }
};

export default SkillInteractionSystem;
