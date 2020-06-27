const { Weapon, PassiveSkill } = require("../../lib").default;

describe("Skills and weapons", () => {
    it("should instantiate properly", () => {
        const skillA = new PassiveSkill().setName("Skill A").setSlot("A");
        const WeaponX = new Weapon().setName("Weapon 1").setMight(12).setCategory("sword");
        const WeaponY = new Weapon().setName("Weapon 2").setMight(12).setCategory("bow");

        expect(skillA.name).toBe("Skill A");
        expect(skillA.slot).toBe("A");
        expect(skillA.might).not.toBeDefined();

        expect(WeaponX.might).toBe(12);
        expect(WeaponX.range).toBe(1);
        expect(WeaponY.range).toBe(2);
        expect(WeaponX.slot).toBe("weapon");
    });
});
