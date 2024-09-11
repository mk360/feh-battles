import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../interfaces/types";
import Characters from "./characters.json";
import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";
import GameState from "../systems/state";
import getSurroundings from "../systems/get-surroundings";
import getMapStats from "../systems/get-map-stats";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];

interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes?: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        onCombatRoundAttack?(this: Skill, target: Entity): void;
        onCombatRoundDefense?(this: Skill, target: Entity): void;
        type?: "aoe";
        getAoETargets?(this: Skill, state: GameState, target: Entity): Set<Entity>;
        getAoEDamage?(this: Skill, state: GameState, target: Entity): number;
    }
}

const SPECIALS: SpecialsDict = {
    "Black Luna": {
        description: "Treats foe's Def/Res as if reduced by 80% during combat. (Skill cannot be inherited.)",
        exclusiveTo: ["Black Knight: Sinister General"],
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defStat = getTargetedDefenseStat(this.entity, target, combatStats);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(combatStats[defStat] * 0.8)
            });
        },
        cooldown: 3
    },
    "Dragon Fang": {
        description: "Boosts damage by 50% of unit's Atk.",
        cooldown: 4,
        onCombatRoundAttack() {
            const { atk } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(atk / 2)
            });
        },
        allowedWeaponTypes: exceptStaves
    },
    "Iceberg": {
        description: "Boosts damage by 50% of unit's Res.",
        cooldown: 3,
        onCombatRoundAttack() {
            const { res } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(res / 2)
            });
        },
        allowedWeaponTypes: exceptStaves
    },
    "Aether": {
        description: "Treats foe's Def/Res as if reduced by 50% during combat. Restores HP = half of damage dealt.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 5,
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defenseStat = getTargetedDefenseStat(this.entity, target, combatStats);
            const stat = combatStats[defenseStat];
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(stat * 0.5)
            });

            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        },
    },
    "Blazing Wind": {
        type: "aoe",
        cooldown: 4,
        allowedWeaponTypes: exceptStaves,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).",
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const { x, y } = target.getOne("Position");
            const tiles = getSurroundings(state.map, y, x, new Set<Uint16Array>(state.map[y][x]));
            for (let tile of tiles) {
                const occupier = state.occupiedTilesMap.get(tile);
                if (occupier && occupier.getOne("Side").value !== this.entity.getOne("Side").value) {
                    targets.add(occupier);
                }
            }

            return targets;
        },
        getAoEDamage(state, target) {
            const { atk } = getMapStats(this.entity);
            const targetedDefense = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [targetedDefense]: defense } = getMapStats(target);

            return Math.floor(atk * 1.5) - defense;
        },
    },
    "Rising Wind": {
        type: "aoe",
        cooldown: 4,
        allowedWeaponTypes: exceptStaves,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const { x, y } = target.getOne("Position");
            const tiles = getSurroundings(state.map, y, x, new Set<Uint16Array>(state.map[y][x]));
            for (let tile of tiles) {
                const occupier = state.occupiedTilesMap.get(tile);
                if (occupier && occupier.getOne("Side").value !== this.entity.getOne("Side").value) {
                    targets.add(occupier);
                }
            }

            return targets;
        },
        getAoEDamage(state, target) {
            const { atk } = getMapStats(this.entity);
            const targetedDefense = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [targetedDefense]: defense } = getMapStats(target);

            return atk - defense;
        },
    },
    "Regnal Astra": {
        description: "Boosts damage by 40% of unit's Spd. (Skill cannot be inherited.)",
        cooldown: 2,
        onCombatRoundAttack() {
            const { spd } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(spd * 0.4)
            });
        }
    },
    "Luna": {
        description: "Treats foe's Def/Res as if reduced by 50% during combat.",
        cooldown: 3,
        onCombatRoundAttack(target) {
            const defStat = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [defStat]: def } = getCombatStats(target);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.5)
            });
        },
    },
};

export default SPECIALS;
