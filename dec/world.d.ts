import { Component, Entity, IComponentChange, IComponentObject, IWorldConfig, World } from "ape-ecs";
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
    startTurn(): (IComponentChange & Partial<{
        detailedComponent: IComponentObject;
    }>)[];
    private processOperation;
    getUnitMapStats(id: string): {
        buffs: Partial<import("./interfaces/types").MandatoryStats>;
        debuffs: Partial<import("./interfaces/types").MandatoryStats>;
        changes: Partial<import("./interfaces/types").MandatoryStats>;
        /**
         * TODO:
         * implement basic combat preview
         * find a way to drop the js files
         */
        hasPanic: boolean;
    };
    getUnitMovement(id: string): {
        movementTiles: Set<Component>;
        attackTiles: Set<Component>;
        warpTiles: Set<Component>;
        targetableTiles: Set<Component>;
        effectiveness: {
            [k: string]: [boolean, boolean];
        };
        targetableEnemies: string[];
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
    previewAttack(attackerId: string, targetCoordinates: {
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
    createHero(member: HeroData, team: "team1" | "team2", teamIndex: number): Entity;
    initiate(lineup: InitialLineup): void;
    private createCharacterComponents;
    private undoComponentChange;
}
export default GameWorld;
//# sourceMappingURL=world.d.ts.map