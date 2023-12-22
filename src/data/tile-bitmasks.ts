const tileBitmasks = {
    type: {
        floor: 0b1111,
        wall: 0,
        forest: 0b111,
        void: 0b10
    },
    occupation: 0b110000,
    trench: 0b1000000,
    defensiveTile: 0b10000000,
    x: 1 << 5,
    y: 1 << 8
} as const;

export default tileBitmasks;
