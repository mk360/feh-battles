
// 00000000001111 tile type
// 00000000110000 occupation
// 00000111000000 x coordinate
// 00111000000000 y coordinate
// 01000000000000 trench
// 10000000000000 defensive tile

const tileBitmasks = {
    type: {
        ground: 0b1111,
        wall: 0,
        forest: 0b111,
        void: 0b10
    },
    occupation: 0b110000,
} as const;

export default tileBitmasks;
