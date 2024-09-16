import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Direction from "../systems/directions";
import Assist from "../components/assist";
import canReachTile from "../systems/can-reach-tile";
import tileBitmasks from "./tile-bitmasks";
import { WeaponType } from "../interfaces/types";
import MovementType from "../components/movement-type";
import Characters from "./characters.json";
import { retreat, shove, swap } from "./effects";
import getPosition from "../systems/get-position";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];

type AssistKind = "refresh" | "movement" | "buff" | "healing";

function allyCanBeHealed(state: GameState, ally: Entity) {
    const { hp, maxHP } = ally.getOne("Stats");
    return hp < maxHP;
};

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
    }
}

const ASSISTS: AssistsDict = {
    "Dance": {
        range: 1,
        description: "Grants another action to target ally. (Cannot target an ally with Sing or Dance.)",
        type: ["refresh"],
        canApply(state, ally) {
            return ally.getOne("FinishedAction") && !ally.getOne("Refresher");
        },
        onApply(state, ally) {
            ally.removeComponent("FinishedAction");
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
            return retreat(state, this.entity, ally).checker() && allyCanMove;
        },
        onApply(state, ally) {
            const { x, y } = getPosition(this.entity);
            retreat(state, this.entity, ally);
            ally.addComponent({
                type: "Move",
                x,
                y
            });
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
        },
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
    "Reposition": {
        description: "Target ally moves to opposite side of unit.",
        range: 1,
        type: ["movement"],
        allowedWeaponTypes: exceptStaves,
        canApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const reversed = vector.reverse();
            const newAllyPosition = reversed.add(reversed.x, reversed.y);
            const mapSlot = state.map[newAllyPosition.y]?.[newAllyPosition.x] as Uint16Array;

            if (mapSlot) {
                return canReachTile(ally, mapSlot) && (mapSlot[0] & tileBitmasks.occupation) === 0;
            }

            return false;
        },
        onApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const newAllyPosition = vector.reverse().add(secondPosition.x, secondPosition.y);

            ally.addComponent({
                type: "Move",
                x: newAllyPosition.x,
                y: newAllyPosition.y,
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
        canApply(state, ally) {
            return ally.getOne("FinishedAction") && !ally.getOne("Refresher");
        },
        onApply(state, ally) {
            ally.removeComponent("FinishedAction");
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
            return swap(state, this.entity, ally).checker();
        },
        onApply(state, ally) {
            return swap(state, this.entity, ally).runner();
        },
        allowedWeaponTypes: exceptStaves
    },
    "Mend": {
        type: ["healing"],
        canApply: allyCanBeHealed,
        onApply(state, ally) {
            ally.addComponent({
                type: "Heal",
                value: 10
            })
        },
        range: 1,
        allowedWeaponTypes: ["staff"],
        description: "Restores 10 HP to target ally."
    },
} as const;

export default ASSISTS;
