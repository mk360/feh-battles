import { Effect } from "./base_skill";
import { CombatOutcome } from "./combat";
import Hero from "./hero";
declare class MapEffectRunner {
    private team1;
    private team2;
    constructor(team1: {
        [k: string]: Hero;
    }, team2: {
        [k: string]: Hero;
    });
    runTurnStartEffects(team: "team1" | "team2"): Effect[];
    runAfterCombatEffects({ hero, enemy, combatOutcome }: {
        hero: Hero;
        enemy: Hero;
        combatOutcome: CombatOutcome;
    }): Effect[];
}
export default MapEffectRunner;
//# sourceMappingURL=map-effect.d.ts.map