import { Effect } from "./base_skill";
import Hero from "./hero";
declare type Effectt = "turnStart";
declare class MapEffectRunner {
    private team1;
    private team2;
    constructor(team1: Hero[], team2: Hero[]);
    runEffects(effect: Effectt, team: "team1" | "team2"): Effect[];
}
export default MapEffectRunner;
//# sourceMappingURL=map-effect.d.ts.map