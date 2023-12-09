import CHARACTERS from "../data/characters";
import getCombatStats from "../systems/get-combat-stats";
import getLv40Stats from "../systems/unit-stats";
import GameWorld from "../world"

describe("get-combat-stats", () => {
    const gameWorld = new GameWorld();
    const dexData = CHARACTERS["Ryoma: Peerless Samurai"];
    const entity = gameWorld.createHero({
        name: "Ryoma: Peerless Samurai",
        rarity: 5,
        weapon: null,
        initialPosition: {
            x: 2,
            y: 2
        },
        skills: {
            assist: null,
            special: null,
            A: null,
            B: null,
            C: null,
            S: null
        }
    }, "team1");

    it("should match level 40 stats if no modifier is applied", () => {
        const { hp, ...rest } = getLv40Stats(dexData.stats, dexData.growthRates, 5);
        const combatStats = getCombatStats(entity);

        expect(rest).toEqual(combatStats);
    });

    it("should take weapons into account", () => {
        const otherEntity = gameWorld.createHero({
            name: "Ryoma: Peerless Samurai",
            rarity: 5,
            weapon: "Raijinto",
            initialPosition: {
                x: 2,
                y: 2
            },
            skills: {
                assist: null,
                special: null,
                A: null,
                B: null,
                C: null,
                S: null
            }
        }, "team1");

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(otherEntity);

        expect(combatStats.atk).toEqual(stats.atk + 16);

        gameWorld.removeEntity(otherEntity);
        otherEntity.destroy();
    });

    it("should apply combat buffs", () => {
        const addedBuff = entity.addComponent({
            type: "CombatBuff",
            atk: 6
        });

        const otherBuff = entity.addComponent({
            type: "CombatBuff",
            def: 6
        });

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);
        const combatStats = getCombatStats(entity);
        expect(combatStats.atk).toEqual(stats.atk + 6);
        expect(combatStats.def).toEqual(stats.def + 6);

        entity.removeComponent(otherBuff);
        entity.removeComponent(addedBuff);
    });

    it("should only apply highest map buffs", () => {
        const firstBuff = entity.addComponent({
            type: "MapBuff",
            atk: 5
        });

        const secondBuff = entity.addComponent({
            type: "MapBuff",
            atk: 3
        });

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(entity);

        expect(combatStats.atk).toEqual(stats.atk + 5);

        entity.removeComponent(firstBuff);
        entity.removeComponent(secondBuff);
    });

    it("should only apply lowest map debuffs", () => {
        const firstDebuff = entity.addComponent({
            type: "MapDebuff",
            atk: -5
        });

        const secondDebuff = entity.addComponent({
            type: "MapDebuff",
            atk: -3
        });

        const stats = getLv40Stats(dexData.stats, dexData.growthRates, 5);

        const combatStats = getCombatStats(entity);

        expect(combatStats.atk).toEqual(stats.atk - 5);

        entity.removeComponent(firstDebuff);
        entity.removeComponent(secondDebuff);
    });
})