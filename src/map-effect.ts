import { Effect } from "./base_skill";
import { CombatOutcome } from "./combat";
import Hero from "./hero";
import { HeroSkills, MapCoordinates } from "./types";

class MapEffectRunner {
    constructor(
        private team1: { [k: string]: Hero; },
        private team2: { [k: string]: Hero; }
    ) {}

    runTurnStartEffects(team: "team1" | "team2") {
        let effects: Effect[] = [];
        for (let hero in this[team]) {
            for (let skillSlot in this[team][hero].skills) {
                const castSlot = skillSlot as keyof HeroSkills;
                if (this[team][hero].skills[castSlot].onTurnStart) {
                    const skillEffects = this[team][hero].skills[castSlot].onTurnStart({
                        wielder: this[team][hero]
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
