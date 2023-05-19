import Hero from "./hero";
declare class MapEffectRunner {
    private team1;
    private team2;
    constructor(team1: Hero[], team2: Hero[]);
    runEffects(effect: "turnStart", team: "team1" | "team2"): void;
}
export default MapEffectRunner;
//# sourceMappingURL=map-effect.d.ts.map