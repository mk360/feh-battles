import { Entity, IWorldConfig, World } from "ape-ecs";
import GameState from "./systems/state";
import { Stat } from "./interfaces/types";
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
}
interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}
declare class GameWorld extends World {
    state: GameState;
    constructor(config?: IWorldConfig);
    generateMap(): void;
    createHero(member: HeroData, team: "team1" | "team2", teamIndex: number): Entity;
    initiate(lineup: InitialLineup): void;
    createCharacterComponents(hero: Entity, team: "team1" | "team2", rarity: number): {
        type: string;
        [k: string]: any;
    }[];
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map