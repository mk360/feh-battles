
// 00000000001111 tile type
// 00000000110000 occupation
// 00000111000000 x coordinate
// 00111000000000 y coordinate
// 01000000000000 trench
// 10000000000000 defensive tile

const tileBitmasks = {
    type: {
        floor: 0b1111,
        wall: 0,
        forest: 0b111,
        void: 0b10
    },
    occupation: 0b110000,
    trench: 1 << 12,
    defensiveTile: 1 << 13,
    x: 0b111 << 6,
    y: 0b111 << 9
} as const;

export default tileBitmasks;
