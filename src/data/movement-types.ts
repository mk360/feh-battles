import { MovementType as MoveType } from "../types";

interface MovementType {
    range: number;
    bitfield: number;
}

const MovementTypes: { [k in MoveType]: MovementType } = {
    infantry: {
        range: 2,
        bitfield: 0b1100
    },
    cavalry: {
        range: 3,
        bitfield: 0b1000
    },
    armored: {
        range: 1,
        bitfield: 0b1100
    },
    flier: {
        range: 2,
        bitfield: 0b1110
    }
} as const;

export default MovementTypes;