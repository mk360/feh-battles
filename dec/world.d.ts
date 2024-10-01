import { Component, Entity, IWorldConfig, World } from "ape-ecs";
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
    merges?: number;
    boon?: Stat;
    bane?: Stat;
    allySupport?: {
        hero: string;
        level: "S" | "A" | "B" | "C";
    };
}
interface InitialLineup {
    team1: HeroData[];
    team2: HeroData[];
}
declare class GameWorld extends World {
    state: GameState;
    constructor(config: Partial<IWorldConfig> & {
        team1: string;
        team2: string;
    });
    switchSides(): void;
    startTurn(): string[];
    private outputEngineActions;
    getUnitMapStats(id: string): {
        buffs: Partial<import("./interfaces/types").MandatoryStats>;
        debuffs: Partial<import("./interfaces/types").MandatoryStats>;
        changes: Partial<import("./interfaces/types").MandatoryStats>;
        hasPanic: boolean;
    };
    runCombat(attackerId: string, movementCoordinates: {
        x: number;
        y: number;
    }, targetCoordinates: {
        x: number;
        y: number;
    }, path: {
        x: number;
        y: number;
    }[]): string[];
    getUnitMovement(id: string): {
        movementTiles: Set<Component>;
        attackTiles: Set<Component>;
        warpTiles: Set<Component>;
        targetableTiles: Set<Component>;
        effectiveness: {
            [k: string]: [boolean, boolean];
        };
        assistTiles: Set<Component>;
    };
    private undoSystemChanges;
    private outputMovementActions;
    previewUnitMovement(id: string, candidateTile: {
        x: number;
        y: number;
    }): boolean;
    moveUnit(id: string, newTile: {
        x: number;
        y: number;
    }, endAction: boolean): string[];
    runAssist(source: string, target: string, actionCoordinates: {
        x: number;
        y: number;
    }): string[];
    endAction(id: string): string[];
    generateMap(): void;
    previewAssist(sourceId: string, targetCoordinates: {
        x: number;
        y: number;
    }, temporaryCoordinates: {
        x: number;
        y: number;
    }): void;
    previewCombat(attackerId: string, targetCoordinates: {
        x: number;
        y: number;
    }, temporaryCoordinates: {
        x: number;
        y: number;
    }): {
        attacker: {
            previousHP: any;
            newHP: number;
            damagePerTurn: number;
            turns: number;
            effectiveness: boolean;
            id: string;
            combatBuffs: Partial<import("./interfaces/types").MandatoryStats>;
        };
        defender: {
            previousHP: any;
            newHP: number;
            damagePerTurn: number;
            turns: number;
            effectiveness: boolean;
            id: string;
            combatBuffs: Partial<import("./interfaces/types").MandatoryStats>;
        };
    };
    produceCombatPreview(attacker: Entity, defender: Entity): {
        attacker: {
            previousHP: any;
            newHP: number;
            damagePerTurn: number;
            turns: number;
            effectiveness: boolean;
            id: string;
            combatBuffs: Partial<import("./interfaces/types").MandatoryStats>;
        };
        defender: {
            previousHP: any;
            newHP: number;
            damagePerTurn: number;
            turns: number;
            effectiveness: boolean;
            id: string;
            combatBuffs: Partial<import("./interfaces/types").MandatoryStats>;
        };
    };
    createHero(member: HeroData, team: string, teamIndex: number): Entity;
    initiate(lineup: InitialLineup): void;
    private createCharacterComponents;
    private undoComponentChange;
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map