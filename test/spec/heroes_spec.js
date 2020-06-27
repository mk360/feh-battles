const { Hero } = require("../../lib").default;

describe("Heroes", () => {
    const Ike = new Hero();
    const Azura = new Hero();
    it("should be instantiated properly", () => {
        expect(Ike).toBeDefined();
        Ike.setName("Ike").setBaseStats({
            hp: 54,
            atk: 36,
            def: 40,
            spd: 32,
            res: 28
        }).setMovementType("infantry");
        expect(Ike.name).toBe("Ike");
        expect(Ike.stats.hp).toBe(54);
        expect(Ike.maxHP).toBe(Ike.stats.hp);
        expect(Ike.stats.atk).toBe(36);
        expect(Ike.stats.def).toBe(40);
        expect(Ike.stats.spd).toBe(32);
        expect(Ike.stats.res).toBe(28);
        for (let stat in Ike.mapMods) {
            expect(Ike.mapMods[stat]).toBe(0);
            expect(Ike.battleMods[stat]).toBe(0);
        }
        expect(Ike.movementType.tiles).toBe(2);
    });
    it("should measure distance properly", () => {
        Ike.setCoordinates({ x: 4, y: 6 });
        Azura.setCoordinates({ x: 3, y: 6 });
        expect(Ike.getDistance(Azura)).toBe(1);

        Azura.setCoordinates({ x: 2, y: 5 });

        expect(Ike.getDistance(Azura)).toBe(3);
        expect(Azura.getDistance(Ike)).toBe(Ike.getDistance(Azura));
    });
});