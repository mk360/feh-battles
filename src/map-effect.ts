import { Effect } from "./base_skill";
import Hero from "./hero";
import Weapon from "./weapon";

type Effectt = "turnStart";

const EffectToHookDictionary: Record<Effectt, keyof Weapon> = {
    "turnStart": "onAfterCombat"
};

class MapEffectRunner {
    constructor(private team1: Hero[], private team2: Hero[]) {
    }

    runEffects(effect: Effectt, team: "team1" | "team2") {
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
}

export default MapEffectRunner;
