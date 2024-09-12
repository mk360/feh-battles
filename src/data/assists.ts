import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Direction from "../systems/directions";
import Assist from "../components/assist";
import canReachTile from "../systems/can-reach-tile";
import tileBitmasks from "./tile-bitmasks";
import { WeaponType } from "../interfaces/types";
import MovementType from "../components/movement-type";
import Characters from "./characters.json";
import { swap } from "./effects";

type AssistKind = "refresh" | "movement" | "buff" | "healing";

function entityCanBeHealed(state: GameState, ally: Entity) {
    const { hp, maxHP } = ally.getOne("Stats");
    return hp < maxHP;
};

interface AssistsDict {
    [k: string]: {
        canApply(this: Assist, state: GameState, ally: Entity, position: { x: number, y: number }): boolean;
        onApply(this: Assist, state: GameState, ally: Entity): void;
        description: string;
        range: number;
        allowedWeaponTypes?: WeaponType[];
        allowedMovementTypes?: MovementType[];
        exclusiveTo?: (keyof typeof Characters)[];
        type: AssistKind[];
    }
}

const ASSISTS: AssistsDict = {
    "Pivot": {
        range: 1,
        description: "Unit moves to opposite side of target ally.",
        type: ["movement"],
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
    "Reposition": {
        description: "Target ally moves to opposite side of unit.",
        range: 1,
        type: ["movement"],
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
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - secondPosition.y);
            const newAllyPosition = vector.add(vector.x, vector.y);
            const mapSlot = state.map[newAllyPosition.y][newAllyPosition.x] as Uint16Array;

            return canReachTile(ally, mapSlot);
        },
        onApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - secondPosition.y);
            const newAllyPosition = vector.add(vector.x, vector.y);
            ally.addComponent({
                type: "Move",
                x: newAllyPosition.x,
                y: newAllyPosition.y,
            });
        }
    },
    "Dance": {
        range: 1,
        description: "Grants another action to target ally. (Cannot target an ally with Sing or Dance.)",
        type: ["refresh"],
        canApply(state, ally) {
            return ally.getOne("FinishedAction") && !ally.getOne("Refresher");
        },
        onApply(state, ally) {
            ally.removeComponent("FinishedAction");
        }
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
        }
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
        }
    },
    "Mend": {
        type: ["healing"],
        canApply: entityCanBeHealed,
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
