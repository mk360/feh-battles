import { Component, IWorldConfig, World } from "ape-ecs";
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
    getUnitMovement(id: string): {
        movementTiles: Set<Component>;
        attackTiles: Set<Component>;
    };
    previewUnitMovement(id: string, candidateTile: {
        x: number;
        y: number;
    }): boolean;
    moveUnit(id: string, newTile: {
        x: number;
        y: number;
    }): Component;
    generateMap(): void;
    private createHero;
    initiate(lineup: InitialLineup): void;
    private createCharacterComponents;
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map