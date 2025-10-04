import { Component, Entity } from "ape-ecs";
import Assist from "../components/assist";
import MovementType from "../components/movement-type";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import { Stats, WeaponType } from "../interfaces/types";
import { applyMapComponent, removeStatuses } from "../systems/apply-map-effect";
import canReachTile from "../systems/can-reach-tile";
import Direction from "../systems/directions";
import getMapStats from "../systems/get-map-stats";
import getPosition from "../systems/get-position";
import GameState from "../systems/state";
import Characters from "./characters.json";
import { retreat, shove, swap } from "./effects";
import tileBitmasks from "./tile-bitmasks";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];

type AssistKind = "refresh" | "movement" | "buff" | "healing";

function allyCanBeHealed(state: GameState, ally: Entity) {
    const { hp, maxHP } = ally.getOne("Stats");
    return hp < maxHP;
};

function allyCanBeRefreshed(state: GameState, ally: Entity) {
    return ally.getOne("FinishedAction") && !ally.getOne("Refresher");
}

interface AssistsDict {
    [k: string]: {
        canApply(this: Assist, state: GameState, ally: Entity, position: { x: number, y: number }): boolean;
        onApply(this: Assist, state: GameState, ally: Entity): void;
        onEquip?(this: Assist): void;
        description: string;
        range: number;
        allowedWeaponTypes?: WeaponType[];
        allowedMovementTypes?: MovementType[];
        exclusiveTo?: (keyof typeof Characters)[];
        type: AssistKind[];
        onSpecialTrigger?(this: Assist, battleState: GameState, target: Entity): void;
        onCombatStart?(this: Assist, battleState: GameState, target: Entity): Component[];
        onCombatAfter?(this: Assist, battleState: GameState, target: Entity): void;
        onCombatInitiate?(this: Assist, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Assist, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Assist, state: GameState, attacker: Entity): void;
        onCombatRoundAttack?(this: Assist, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Assist, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onEquip?(this: Assist): any;
        onTurnCheckRange?(this: Assist, state: GameState): void;
        onTurnStart?(this: Assist, battleState: GameState): void;
        onTurnStartBefore?(this: Assist, battleState: GameState): void;
        onTurnStartAfter?(this: Assist, battleState: GameState): void;
        onAssistAfter?(this: Assist, battleState: GameState, ally: Entity, assistSkill: Assist): void;
        onAllyAssistAfter?(this: Assist, battleState: GameState, ally: Entity, assistSkill: Assist): void;
    }
}

const ASSISTS: AssistsDict = {
    "Ardent Sacrifice": {
        description: "Restores 10 HP to target ally. Unit loses 10 HP but cannot go below 1.",
        type: ["healing"],
        allowedWeaponTypes: exceptStaves,
        canApply(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");

            return allyCanBeHealed(state, ally) || hp < maxHP;
        },
        onApply(state, ally) {
            const { hp } = this.entity.getOne("Stats");
            const { hp: allyHP, maxHP } = ally.getOne("Stats");
            const newUnitHP = Math.max(1, hp - 10);
            const newAllyHP = Math.min(allyHP + 10, maxHP);
            this.entity.addComponent({
                type: "SacrificeHP",
                // todo : réviser l'intérêt du composant
                value: newUnitHP - hp,
            });

            ally.addComponent({
                type: "SacrificeHP",
                value: newAllyHP - allyHP
            });
        },
        range: 1
    },
    "Dance": {
        range: 1,
        description: "Grants another action to target ally. (Cannot target an ally with Sing or Dance.)",
        type: ["refresh"],
        canApply: allyCanBeRefreshed,
        onApply(state, ally) {
            return [ally.addComponent({
                type: "Refresh"
            })];
        },
        exclusiveTo: ["Inigo: Indigo Dancer", "Ninian: Oracle of Destiny", "Olivia: Blushing Beauty", "Olivia: Festival Dancer"]
    },
    "Draw Back": {
        type: ["movement"],
        range: 1,
        description: "Unit moves 1 space away from target ally. Ally moves to unit's previous space.",
        allowedWeaponTypes: exceptStaves,
        canApply(state, ally, position) {
            const { x, y } = position;
            const currentMapTile = state.map[y][x];
            const allyCanMove = canReachTile(ally, currentMapTile, true);
            return allyCanMove && retreat(state, this.entity, ally, { x, y }).checker();
        },
        onApply(state, ally) {
            retreat(state, this.entity, ally).runner(true);
        },
    },
    "Harsh Command": {
        description: "Converts penalties on target into bonuses.",
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"],
        canApply(state, ally) {
            return !!ally.getOne("MapDebuff");
        },
        onApply(state, ally) {
            const mapDebuffs = ally.getComponents("MapDebuff");
            const newBuffs: Stats = {
                atk: 0,
                spd: 0,
                def: 0,
                res: 0
            };

            mapDebuffs.forEach((component) => {
                const { type, ...stats } = component.getObject(false);
                for (let stat in stats) {
                    newBuffs[stat] = Math.max(-stats[stat], newBuffs[stat]);
                }
                ally.removeComponent(component);
            });

            removeStatuses(ally, "Penalty");
            applyMapComponent(ally, "MapBuff", newBuffs, this.entity);
        },
    },
    "Heal": {
        range: 1,
        type: ["healing"],
        description: "Restores 5 HP to target ally.",
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            ally.addComponent({
                type: "Heal",
                value: 5
            });
        },
        allowedWeaponTypes: ["staff"]
    },
    "Martyr": {
        type: ["healing"],
        range: 1,
        description: "Slows Special trigger (cooldown count+1). Restores X HP to target (X = damage dealt to unit + 7). Restores Y HP to unit (Y = half damage dealt to unit).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        canApply: allyCanBeHealed,
        allowedWeaponTypes: ["staff"],
        onApply(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const diff = maxHP - hp;
            const restoredToAlly = diff + 7;
            const restoredToUnit = Math.floor(diff / 2);

            ally.addComponent({
                type: "Heal",
                value: restoredToAlly,
            });

            this.entity.addComponent({
                type: "Heal",
                value: restoredToUnit
            });
        }
    },
    "Martyr+": {
        type: ["healing"],
        range: 1,
        description: "Restores HP = damage dealt to unit +50% of Atk. (Minimum of 7 HP.) Restores HP to unit = half damage dealt to unit.",
        canApply: allyCanBeHealed,
        allowedWeaponTypes: ["staff"],
        onApply(state, ally) {
            const { hp, maxHP, atk } = this.entity.getOne("Stats");
            const diff = maxHP - hp;
            const restoredToAlly = Math.min(diff + Math.floor(atk / 2), 7);
            const restoredToUnit = Math.floor(diff / 2);

            ally.addComponent({
                type: "Heal",
                value: restoredToAlly,
            });

            this.entity.addComponent({
                type: "Heal",
                value: restoredToUnit
            });
        }
    },
    "Mend": {
        description: "Restores 10 HP to target ally.",
        type: ["healing"],
        range: 1,
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            ally.addComponent({
                type: "Heal",
                value: 10
            });
        },
        allowedWeaponTypes: ["staff"]
    },
    "Pivot": {
        range: 1,
        description: "Unit moves to opposite side of target ally.",
        type: ["movement"],
        allowedWeaponTypes: exceptStaves,
        canApply(state, ally, position: { x: number, y: number }) {
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - position.x, secondPosition.y - position.y);
            const newVector = vector.add(position.x, position.y).add(vector.x, vector.y);
            const targetedMapSlot = state.map[newVector.y]?.[newVector.x] as Uint16Array;
            if (targetedMapSlot) {
                return canReachTile(this.entity, targetedMapSlot) && (targetedMapSlot[0] & tileBitmasks.occupation) === 0;
            }
            return false;
        },
        onApply(state, ally) {
            const firstPosition = this.entity.getOne("Position");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const newVector = vector.add(firstPosition.x, firstPosition.y).add(vector.x, vector.y);
            this.entity.addComponent({
                type: "Move",
                x: newVector.x,
                y: newVector.y
            });
            this.entity.addComponent({
                type: "Pivot",
                x: newVector.x,
                y: newVector.y,
            });
        },
    },
    "Physic": {
        description: "Restores 8 HP to target ally. Range = 2.",
        range: 2,
        allowedWeaponTypes: ["staff"],
        type: ["healing"],
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            ally.addComponent({
                type: "Heal",
                value: 8
            });
        },
    },
    "Physic+": {
        description: "Restores HP = 50% of Atk. (Minimum of 8 HP.) Range = 2.",
        range: 2,
        type: ["healing"],
        allowedWeaponTypes: ["staff"],
        onApply(state, ally) {
            const { atk } = getMapStats(this.entity);
            const recovered = Math.max(8, Math.floor(atk / 2));

            ally.addComponent({
                type: "Heal",
                value: recovered
            });
        },
        canApply: allyCanBeHealed
    },
    "Rally Attack": {
        description: "Grants Atk+4 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                atk: 4
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Atk/Def": {
        description: "Grants Atk/Def+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                atk: 3,
                def: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Atk/Res": {
        description: "Grants Atk/Res+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                atk: 3,
                res: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Atk/Spd": {
        description: "Grants Atk/Spd+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                atk: 3,
                spd: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Defense": {
        description: "Grants Def+4 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                def: 4
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Def/Res": {
        description: "Grants Def/Res+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                def: 3,
                res: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Resistance": {
        description: "Grants Res+4 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                res: 4
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Spd/Def": {
        description: "Grants Spd/Def+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                def: 3,
                spd: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Spd/Res": {
        description: "Grants Spd/Res+3 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                res: 3,
                spd: 3
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Rally Speed": {
        description: "Grants Spd+4 to target ally for 1 turn.",
        canApply() { return true },
        onApply(state, ally) {
            applyMapComponent(ally, "MapBuff", {
                spd: 4
            }, this.entity);
        },
        range: 1,
        allowedWeaponTypes: exceptStaves,
        type: ["buff"]
    },
    "Reconcile": {
        description: "Restores 7 HP to unit and target ally.",
        type: ["healing"],
        range: 1,
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            this.entity.addComponent({
                type: "Heal",
                value: 7
            });
            ally.addComponent({
                type: "Heal",
                value: 7
            });
        },
        allowedWeaponTypes: ["staff"]
    },
    "Recover": {
        description: "Slows Special trigger (cooldown count+1). Restores 15 HP to target ally.",
        type: ["healing"],
        range: 1,
        allowedWeaponTypes: ["staff"],
        canApply: allyCanBeHealed,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onApply(state, ally) {
            ally.addComponent({
                type: "Heal",
                value: 15
            });
        },
    },
    "Recover+": {
        description: "Restores HP = 50% of Atk +10. (Minimum of 15 HP.)",
        type: ["healing"],
        range: 1,
        allowedWeaponTypes: ["staff"],
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            const { atk } = getMapStats(this.entity);
            const recovered = Math.max(15, Math.floor(atk / 2) + 10);

            ally.addComponent({
                type: "Heal",
                value: recovered
            });
        },
    },
    "Rehabilitate": {
        description: "Slows Special trigger (cooldown count+1). If target's HP is ≤ 50%, the lower the target's HP, the more HP is restored. (Minimum of 7 HP.)",
        type: ["healing"],
        allowedWeaponTypes: ["staff"],
        canApply: allyCanBeHealed,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onApply(state, ally) {
            const { hp, maxHP } = ally.getOne("Stats");
            let amount = 7;
            if (hp / maxHP <= 0.5) {
                amount += Math.max(maxHP - 2 * hp, 0);
            }
            ally.addComponent({
                type: "Heal",
                value: amount
            });
        },
        range: 1,
    },
    "Rehabilitate+": {
        description: "Restores HP = 50% of Atk -10. (Minimum of 7 HP.) If target's HP is ≤ 50%, the lower the target's HP, the more HP is restored.",
        type: ["healing"],
        allowedWeaponTypes: ["staff"],
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            const { atk } = getMapStats(this.entity);
            const { hp, maxHP } = ally.getOne("Stats");
            let amount = Math.max(Math.floor(atk / 2) - 10, 7);
            if (hp / maxHP <= 0.5) {
                amount += Math.max(0, maxHP - 2 * hp);
            }
            ally.addComponent({
                type: "Heal",
                value: amount
            });
        },
        range: 1,
    },
    "Reciprocal Aid": {
        description: "Unit and target ally swap HP. (Neither can go above their max HP.)",
        type: ["healing"],
        allowedWeaponTypes: exceptStaves,
        range: 1,
        canApply(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");

            return allyCanBeHealed(state, ally) || hp < maxHP;
        },
        onApply(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { hp: allyHP, maxHP: allyMaxHP } = ally.getOne("Stats");
            const newSelfHP = Math.min(allyHP, maxHP);
            const newAllyHP = Math.min(allyMaxHP, hp);

            this.entity.addComponent({
                type: "Heal",
                value: newSelfHP - hp,
            });

            ally.addComponent({
                type: "Heal",
                value: newAllyHP - allyHP,
            });
        },
    },
    "Reposition": {
        description: "Target ally moves to opposite side of unit.",
        range: 1,
        type: ["movement"],
        allowedWeaponTypes: exceptStaves,
        canApply(state, ally) {
            const firstPosition = getPosition(this.entity);
            const secondPosition = getPosition(ally);
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const reversed = vector.reverse();
            const changeVector = reversed.add(reversed.x, reversed.y);
            const newAllyPosition = changeVector.add(secondPosition.x, secondPosition.y);
            const validMapTile = state.map[newAllyPosition.y]?.[newAllyPosition.x] as Uint16Array;

            if (validMapTile) {
                return canReachTile(ally, validMapTile) && (validMapTile[0] & tileBitmasks.occupation) === 0;
            }

            return false;
        },
        onApply(state, ally) {
            const firstPosition = getPosition(this.entity);
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const reversed = vector.reverse();
            const changeVector = reversed.add(reversed.x, reversed.y);
            const newAllyPosition = changeVector.add(secondPosition.x, secondPosition.y);

            ally.addComponent({
                type: "Move",
                x: newAllyPosition.x,
                y: newAllyPosition.y,
            });

            this.entity.addComponent({
                type: "Move",
                x: firstPosition.x,
                y: firstPosition.y,
            });

            this.entity.addComponent({
                type: "Reposition",
                targetEntity: ally,
                x: newAllyPosition.x,
                y: newAllyPosition.y
            });
        },
    },
    "Shove": {
        range: 1,
        description: "Pushes target ally 1 space away.",
        type: ["movement"],
        canApply(state, ally) {
            return shove(state, this.entity, ally, 1).checker()
        },
        onApply(state, ally) {
            shove(state, this.entity, ally, 1).runner();
        },
        allowedWeaponTypes: exceptStaves
    },
    "Sing": {
        range: 1,
        type: ["refresh"],
        description: "Grants another action to target ally. (Cannot target an ally with Sing or Dance.)",
        canApply: allyCanBeRefreshed,
        onApply(state, ally) {
            return [ally.addComponent({
                type: "Refresh"
            })];
        },
        exclusiveTo: ["Azura: Lady of Ballads", "Azura: Lady of the Lake", "Shigure: Dark Sky Singer"],
    },
    "Smite": {
        description: "Pushes target ally 2 spaces away.",
        canApply(state, ally) {
            return shove(state, this.entity, ally, 2).checker()
        },
        type: ["movement"],
        onApply(state, ally) {
            shove(state, this.entity, ally, 2).runner();
        },
        allowedWeaponTypes: exceptStaves,
        range: 1,
    },
    "Swap": {
        range: 1,
        description: "Unit and target ally swap spaces.",
        type: ["movement"],
        canApply(state, ally) {
            return swap().checker(state, this.entity, ally);
        },
        onApply(state, ally) {
            return swap().runner(state, this.entity, ally);
        },
        allowedWeaponTypes: exceptStaves
    },
} as const;

export default ASSISTS;
