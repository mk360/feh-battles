import { Entity } from "ape-ecs";
import GameState from "../systems/state";
import Direction from "../systems/directions";
import Assists from "../components/assist";
import canReachTile from "../systems/can-reach-tile";

interface AssistsDict {
    [k: string]: {
        canApply(this: Assists, state: GameState, ally: Entity): boolean;
        onApply(this: Assists, state: GameState, ally: Entity): void;
        description: string;
        range: number;
    }
}

const ASSISTS: AssistsDict = {
    "Pivot": {
        range: 1,
        description: "Unit moves to opposite side of target ally.",
        canApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const newPosition = vector.reverse().add(secondPosition.x, secondPosition.y);
            const mapSlot = state.map[newPosition.y][newPosition.x] as Uint16Array;

            return canReachTile(this.entity, mapSlot);
        },
        onApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const newPosition = vector.reverse().add(secondPosition.x, secondPosition.y);
            this.entity.addComponent({
                type: "Move",
                x: newPosition.x,
                y: newPosition.y
            });
        },
    },
    "Reposition": {
        description: "Target ally moves to opposite side of unit.",
        range: 1,
        canApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const vector = new Direction(secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y);
            const newAllyPosition = vector.reverse().add(secondPosition.x, secondPosition.y);
            const mapSlot = state.map[newAllyPosition.y][newAllyPosition.x] as Uint16Array;

            return canReachTile(ally, mapSlot);
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
        canApply(state, ally) {
            return ally.getOne("FinishedAction") && !ally.getOne("Refresher");
        },
        onApply(state, ally) {
            ally.removeComponent("FinishedAction");
        }
    },
    "Sing": {
        range: 1,
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
        canApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            const firstMapSlot = state.map[firstPosition.y][firstPosition.x];
            const secondMapSlot = state.map[secondPosition.y][secondPosition.x];

            return canReachTile(ally, firstMapSlot) && canReachTile(this.entity, secondMapSlot);
        },
        onApply(state, ally) {
            const firstPosition = this.entity.getOne("TemporaryPosition");
            const secondPosition = ally.getOne("Position");
            this.entity.addComponent({
                type: "Move",
                x: secondPosition.x,
                y: secondPosition.y
            });
            ally.addComponent({
                type: "Move",
                x: firstPosition.x,
                y: firstPosition.y
            });
        }
    }
} as const;

export default ASSISTS;
