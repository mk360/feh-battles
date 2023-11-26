const CHARACTERS = {
    "Morgan: Devoted Darkness": {
        color: "Red",
        weaponType: "tome",
        stats: {
            hp: 40,
            atk: 39,
            spd: 17,
            def: 41,
            res: 35
        }
    },
    "Ryoma: Peerless Samurai": {
        color: "Red",
        weaponType: "sword",
        stats: {
            hp: 41,
            atk: 34,
            spd: 35,
            def: 27,
            res: 21
        }
    }
} as const;

export default CHARACTERS;
