import { World } from "ape-ecs";
interface HeroData {
    name: string;
    rarity: number;
    skills: {
        weapon: string;
        assist: string;
        special: string;
        A: string;
        B: string;
        C: string;
        S: string;
    };
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
    private state;
    id: string;
    constructor(id: string);
    initiate(lineup: InitialLineup): void;
    createCharacterComponents(character: string, rarity: number, team: string): {
        type: string;
        [k: string]: any;
    }[];
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map