import { MovementType as MoveType } from "../types";

interface MovementType {
    range: number;
    bitField: number;
}

const MovementTypes: { [k in MoveType]: MovementType } = {
    infantry: {
        range: 2,
        bitField: 0b1100
    },
    cavalry: {
        range: 3,
        bitField: 0b1000
    },
    armored: {
        range: 1,
        bitField: 0b1100
    },
    flier: {
        range: 2,
        bitField: 0b1111
    }
} as const;

export default MovementTypes;