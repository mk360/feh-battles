import { Effect } from "./base_skill";
import Hero from "./hero";

class MapEffectRunner {
    constructor(private team1: Hero[], private team2: Hero[]) {
    }

    runEffects(effect: "turnStart", team: "team1" | "team2") {
        const effects: Effect[] = [];
    }
}

export default MapEffectRunner;
