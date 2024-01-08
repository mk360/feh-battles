import { Entity, IWorldConfig, World } from "ape-ecs";
import GameState from "./systems/state";
import { Stat } from "./interfaces/types";
import Map1 from "./data/maps/map1.json";
interface HeroData {
    name: string;
    rarity: number;
    weapon: string;
    skills: {
        assist: string;
        special: string;
        A: string;
        B: string;
        C: string;
        S: string;
    };
    boon?: Stat;
    bane?: Stat;
    initialPosition: {
        x: number;
        y: number;
    };
}
interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}
declare class GameWorld extends World {
    state: GameState;
    constructor(config?: IWorldConfig);
    generateMap(config: typeof Map1): void;
    createHero(member: HeroData, team: "team1" | "team2"): Entity;
    initiate(lineup: InitialLineup): void;
    createCharacterComponents(hero: Entity, team: "team1" | "team2", rarity: number): {
        type: string;
        [k: string]: any;
    }[];
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map