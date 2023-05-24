import { Effect } from "./base_skill";
import { CombatOutcome } from "./combat";
import Hero from "./hero";

class MapEffectRunner {
    constructor(private team1: Hero[], private team2: Hero[]) {
    }

    runTurnStartEffects(team: "team1" | "team2") {
        let effects: Effect[] = [];
        for (let hero of this[team]) {
            for (let skillSlot in hero.skills) {
                const castSlot = skillSlot as keyof typeof hero.skills;
                if (hero.skills[castSlot].onTurnStart) {
                    const skillEffects = hero.skills[castSlot].onTurnStart({
                        wielder: hero
                    });
                    if (skillEffects.length) {
                        effects = effects.concat(skillEffects);
                    }
                }
            }
        }
        return effects;
    }

    runAfterCombatEffects({
        hero,
        enemy,
        combatOutcome
    }: { hero: Hero, enemy: Hero, combatOutcome: CombatOutcome}) {
        let effects: Effect[] = [];
        for (let skillSlot in hero.skills) {
            const castSlot = skillSlot as keyof typeof hero.skills;
            console.log(hero.skills[castSlot].onAfterCombat, hero.skills[castSlot].name);
            if (hero.skills[castSlot].onAfterCombat) {
                const skillEffects = hero.skills[castSlot].onAfterCombat?.({
                    wielder: hero,
                    enemy,
                });
                effects = effects.concat(skillEffects);
            }
        }
        for (let skillSlot in enemy.skills) {
            const castSlot = skillSlot as keyof typeof enemy.skills;
            if (enemy.skills[castSlot].onAfterCombat) {
                const skillEffects = enemy.skills[castSlot].onAfterCombat?.({
                    wielder: enemy,
                    enemy: hero,
                });
                effects = effects.concat(skillEffects);
            }
        }

        return effects;
    }
}

export default MapEffectRunner;
