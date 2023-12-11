import Hero from "../entities/hero";
import GameState from "../systems/state";
import { WeaponType } from "../weapon";
import { MovementType } from "../types";
import * as Effects from "./effects";
import Skill from "../components/skill";
import Characters from "./characters.json";
import { Entity } from "ape-ecs";
import { CombatOutcome } from "../combat";
import getEnemies from "../utils/get-enemies";
import HeroSystem from "../systems/hero";

interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        displayName?: string;
        type: WeaponType;
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        protects?: (MovementType | WeaponType)[];
        onCombatStart?(...args: any[]): any;
        onCombatAfter?(this: Skill, battleState: GameState, target: Entity, combat: CombatOutcome): void;
        onInitiate?(...args: any[]): any;
        onDefense?(...args: any[]): any;
        onEquip?(this: Skill): any;
        onTurnStart?(this: Skill, battleState: GameState): void;
    }
}

type Battle = Turn[];

interface Turn {
    attacker: Hero;
    defender: Hero;
    damage: number;
    order: number; // ordre absolu
    consecutiveOrder: number; // si tours consécutifs, incrémenter ce
}

const WEAPONS: WeaponDict = {
    "Fólkvangr": {
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+5 for 1 turn.",
        onTurnStart() {
            Effects.defiant(this, "atk", 5);
        },
        type: "sword",
        might: 16,
        exclusiveTo: ["Alfonse: Prince of Askr"]
    },
    "Fensalir": {
        description: "At start of turn, inflicts Atk-4 on foes within 2 spaces through their next actions.",
        might: 16,
        exclusiveTo: ["Sharena: Princess of Askr"],
        type: "lance",
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, this.entity)) {
                    enemy.addComponent({
                        type: "MapBuff",
                        atk: -4
                    });
                }
            }
        },
    },
    "Iron Sword": {
        description: "",
        might: 6,
        type: "sword"
    },
    "Iron Lance": {
        description: "",
        might: 6,
        type: "lance"
    },
    "Iron Axe": {
        description: "",
        might: 6,
        type: "axe"
    },
    "Iron Bow": {
        description: "",
        might: 4,
        effectiveAgainst: ["flier"],
        type: "bow"
    },
    "Iron Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-3 on foe through its next action.",
        might: 3,
        onCombatAfter(state, target, combat) {
            Effects.dagger(this, state, combat, target, {
                def: -3,
                res: -3
            });
        },
        type: "dagger"
    },
    "Steel Sword": {
        description: "",
        might: 8,
        type: "sword"
    },
    "Steel Lance": {
        description: "",
        might: 8,
        type: "lance"
    },
    "Steel Axe": {
        description: "",
        might: 8,
        type: "axe"
    },
    "Steel Bow": {
        description: "Effective against flying foes.",
        effectiveAgainst: ["flier"],
        might: 6,
        type: "bow"
    },
    "Steel Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-3 on foe through its next action.",
        type: "dagger",
        might: 5,
        onCombatAfter(state, target, combat) {
            Effects.dagger(this, state, combat, target, {
                def: -3,
                res: -3
            });
        }
    },
    "Silver Sword": {
        description: "",
        might: 11,
        type: "sword"
    },
    "Silver Lance": {
        description: "",
        might: 11,
        type: "lance"
    },
    "Silver Axe": {
        description: "",
        might: 11,
        type: "axe"
    },
    "Silver Bow": {
        description: "Effective against flying foes.",
        effectiveAgainst: ["flier"],
        type: "bow",
        might: 9
    },
    "Silver Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-5 on foe through its next action.",
        onCombatAfter(battleState, target, combat) {
            Effects.dagger(this, battleState, combat, target, {
                def: -5,
                res: -5
            });
        },
        might: 7,
        type: "dagger"
    },
    "Silver Sword+": {
        description: "",
        might: 15,
        type: "sword"
    },
    "Silver Lance+": {
        description: "",
        might: 15,
        type: "lance"
    },
    "Silver Axe+": {
        description: "",
        might: 15,
        type: "axe"
    },
    "Silver Bow+": {
        description: "Effective against flying foes.",
        effectiveAgainst: ["flier"],
        type: "bow",
        might: 13
    },
    "Silver Dagger+": {
        description: "After combat, if unit attacked, inflicts Def/Res-7 on foe through its next action.",
        onCombatAfter(battleState, target, combat) {
            Effects.dagger(this, battleState, combat, target, {
                def: -7,
                res: -7
            });
        },
        might: 10,
        type: "dagger"
    },
    "Fire Breath": {
        description: "",
        type: "breath",
        might: 6,
    },
    "Fire Breath+": {
        description: "",
        type: "breath",
        might: 8,
    },
    "Flametongue": {
        description: "",
        type: "breath",
        might: 11,
    },
    "Flametongue+": {
        description: "",
        type: "breath",
        might: 15,
    },
    "Armorslayer": {
        description: "Effective against armored foes.",
        might: 8,
        type: "sword",
        effectiveAgainst: ["armored"],
    },
    "Armorslayer+": {
        description: "Effective against armored foes.",
        might: 12,
        type: "sword",
        effectiveAgainst: ["armored"],
    },
    "Hana's Katana": {
        description: "Effective against armored foes.",
        might: 16,
        type: "sword",
        exclusiveTo: ["Hana: Focused Samurai"],
        effectiveAgainst: ["armored"],
    },
    "Falchion (Awakening)": {
        description: "Effective against dragon foes. At the start of every third turn, restores 10 HP.",
        effectiveAgainst: ["breath"],
        might: 16,
        displayName: "Falchion",
        type: "sword",
        onTurnStart(battleState) {
            Effects.renewal(this, battleState.turn, (count) => count % 3 === 0, 10);
        },
        exclusiveTo: ["Chrom: Exalted Prince", "Lucina: Future Witness"]
    },
    "Falchion (Mystery)": {
        description: "Effective against dragon foes. At the start of every third turn, restores 10 HP.",
        effectiveAgainst: ["breath"],
        might: 16,
        displayName: "Falchion",
        type: "sword",
        onTurnStart(battleState) {
            Effects.renewal(this, battleState.turn, (count) => count % 3 === 0, 10);
        },
        exclusiveTo: ["Marth: Altean Prince"]
    },
    "Falchion (Gaiden)": {
        description: "Effective against dragon foes. At start of odd-numbered turns, restores 10 HP.",
        effectiveAgainst: ["breath"],
        might: 16,
        displayName: "Falchion",
        type: "sword",
        onTurnStart(battleState) {
            Effects.renewal(this, battleState.turn, (count) => count % 3 === 0, 10);
        },
        exclusiveTo: ["Alm: Hero of Prophecy"]
    },
    "Valflame": {
        description: "At start of turn, inflicts Atk/Res-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        type: "tome",
        might: 14,
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            const position = this.entity.getOne("Position");
            for (let enemy of enemies) {
                const enemyPos = enemy.getOne("Position");
                if ((enemyPos.x === position.x || enemyPos.y === position.y) && enemy.getOne("Stats").res < this.entity.getOne("Stats").res) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -4,
                        res: -4
                    });
                }
            }
        },
        exclusiveTo: ["Arvis: Emperor of Flame"]
    },
    "Raijinto": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "sword",
        onCombatStart() {
            this.entity.addComponent({
                type: "Counterattack"
            });
        },
        exclusiveTo: ["Ryoma: Peerless Samurai"]
    },
    "Siegfried": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "sword",
        onCombatStart() {
            this.entity.addComponent({
                type: "Counterattack"
            });
        },
        exclusiveTo: ["Xander: Paragon Knight"]
    },
    "Sieglinde": {
        description: "At start of turn, grants Atk+4 to adjacent allies for 1 turn.",
        might: 16,
        type: "sword",
        onTurnStart: function (state) {
            Effects.honeStat(this, state, "atk", 4);
        },
        exclusiveTo: ["Eirika: Restoration Lady"]
    },
    "Siegmund": {
        description: "At start of turn, grants Atk+3 to adjacent allies for 1 turn.",
        might: 16,
        type: "lance",
        onTurnStart(battleState) {
            Effects.honeStat(this, battleState, "atk", 3);
        },
        exclusiveTo: ["Ephraim: Restoration Lord"]
    }
};

export default WEAPONS;
