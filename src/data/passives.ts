import { Entity } from "ape-ecs";
import Skill from "../components/skill";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import { MovementType, PassiveSlot, Stat, Stats, WeaponColor, WeaponType } from "../interfaces/types";
import { applyMapComponent } from "../systems/apply-map-effect";
import canReachTile from "../systems/can-reach-tile";
import { defenderCanDefend } from "../systems/generate-turns";
import getAffinity from "../systems/get-affinity";
import getCombatStats from "../systems/get-combat-stats";
import getPosition from "../systems/get-position";
import getSurroundings from "../systems/get-surroundings";
import getTileCoordinates from "../systems/get-tile-coordinates";
import HeroSystem from "../systems/hero";
import GameState from "../systems/state";
import getAllies from "../utils/get-allies";
import getEnemies from "../utils/get-enemies";
import ASSISTS from "./assists";
import Characters from "./characters.json";
import { bond, breaker, combatBuffByRange, counterattack, defiant, elementalBoost, guidance, honeStat, mapBuffByMovementType, movementBasedCombatBuff, ploy, renewal, retreat, shove, swap, tactic, threaten, wave } from "./effects";
import SPECIALS from "./specials";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];
const closeRange: WeaponType[] = ["sword", "breath", "axe", "lance", "beast"];
const farRange: WeaponType[] = ["tome", "staff", "bow", "dagger"];

interface PassivesDict {
    [k: string]: {
        description: string;
        slot: PassiveSlot;
        allowedMovementTypes?: MovementType[];
        allowedWeaponTypes?: WeaponType[];
        extraAllowedWeapons?: (`${WeaponColor}-${WeaponType}`)[];
        allowedColors?: WeaponColor[];
        protects?: (MovementType | WeaponType)[];
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        onCombatStart?(this: Skill, state: GameState, target: Entity): void;
        onEquip?(this: Skill): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatAfter?(this: Skill, state: GameState, target: Entity): void;
        onCombatRoundAttack?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onSpecialTrigger?(this: Skill, battleState: GameState, target: Entity): void;
        onTurnStart?(this: Skill, state: GameState): void;
        onTurnStartBefore?(this: Skill, state: GameState): void;
        onTurnStartAfter?(this: Skill, state: GameState): void;
        onTurnCheckRange?(this: Skill, state: GameState): void;
        onTurnAllyCheckRange?(this: Skill, state: GameState, ally: Entity): void;
        onTurnEnemyCheckRange?(this: Skill, state: GameState, enemy: Entity): void;
        onAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        onAllyAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        isSacredSeal?: true;
    }
}

const ward = movementBasedCombatBuff({ def: 4, res: 4 }, 2);
const goad = movementBasedCombatBuff({ atk: 4, spd: 4 }, 2);

function turnIsOdd(turnCount: number) {
    return !!(turnCount & 1);
}

const PASSIVES: PassivesDict = {
    "Attack +1": {
        description: "Grants Attack +1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk++;
        },
    },
    "Attack +2": {
        description: "Grants Attack +2.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk += 2;
        },
    },
    "Attack +3": {
        description: "Grants Attack +3.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk += 3;
        },
    },
    "Attack/Def 1": {
        description: "Grants Atk/Def+1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk++;
            this.entity.getOne("Stats").def++;
        }
    },
    "Attack/Def 2": {
        description: "Grants Atk/Def+2.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk += 2;
            this.entity.getOne("Stats").def += 2;
        }
    },
    "Attack/Res 1": {
        description: "Grants Atk/Res+1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk++;
            this.entity.getOne("Stats").res++;
        }
    },
    "Attack/Res 2": {
        description: "Grants Atk/Res+2.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk += 2;
            this.entity.getOne("Stats").res += 2;
        }
    },
    "Beorc's Blessing": {
        slot: "B",
        description: `Neutralizes cavalry and flying foes' bonuses (from skills like Fortify, Rally, etc.) during combat. (Skill cannot be inherited.)`,
        onCombatStart(state, target) {
            if (target.has("PanicComponent")) return;
            if (["flier", "cavalry"].includes(target.getOne("MovementType").value)) {
                target.addComponent({
                    type: "NeutralizeMapBuffs",
                });
            }
        },
        exclusiveTo: ["Ike: Brave Mercenary"]
    },
    "Close Counter": {
        description: "Unit can counterattack regardless of enemy range.",
        slot: "A",
        allowedWeaponTypes: farRange
    },
    "Crusader's Ward": {
        description: "If unit receives consecutive attacks and foe's Range = 2, reduces damage from foe's second attack onward by 80%. (Skill cannot be inherited.)",
        exclusiveTo: ["Sigurd: Holy Knight"],
        onCombatRoundDefense(enemy, combatRound) {
            if (combatRound.consecutiveTurnNumber > 1 && enemy.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "RoundDamageReduction",
                    percentage: 0.8
                });
            }
        },
        slot: "B",
    },
    "Defense +1": {
        description: "Grants Defense +1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").def++;
        },
    },
    "Defense +2": {
        description: "Grants Defense +2.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").def += 2;
        },
    },
    "Defense +3": {
        description: "Grants Defense +3.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").def += 3;
        },
    },
    "Distant Counter": {
        description: "Unit can counterattack regardless of enemy range.",
        slot: "A",
        onCombatStart() {
            counterattack(this);
        },
        allowedWeaponTypes: closeRange
    },
    "Follow-Up Ring": {
        description: "At start of combat, if unit's HP ≥ 50%, unit makes a guaranteed follow-up attack. (Skill cannot be inherited.)",
        slot: "B",
        exclusiveTo: ["Arden: Strong and Tough"],
        onCombatStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        }
    },
    "Fury 1": {
        description: "Grants Atk/Spd/Def/Res+1. After combat, deals 2 damage to unit.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk++;
            stats.def++;
            stats.spd++;
            stats.res++;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "MapDamage",
                value: 2
            });
        }
    },
    "Fury 2": {
        description: "Grants Atk/Spd/Def/Res+2. After combat, deals 4 damage to unit.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 2;
            stats.def += 2;
            stats.spd += 2;
            stats.res += 2;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "MapDamage",
                value: 4
            });
        }
    },
    "Fury 3": {
        description: "Grants Atk/Spd/Def/Res+3. After combat, deals 6 damage to unit.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 3;
            stats.def += 3;
            stats.spd += 3;
            stats.res += 3;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "MapDamage",
                value: 6
            });
        }
    },
    "HP +3": {
        description: "Grants HP +3.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").maxHP += 3;
            this.entity.getOne("Stats").hp += 3;
        },
    },
    "HP +4": {
        description: "Grants HP +4.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").maxHP += 4;
            this.entity.getOne("Stats").hp += 4;
        },
    },
    "HP +5": {
        description: "Grants HP +5.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").maxHP += 5;
            this.entity.getOne("Stats").hp += 5;
        },
    },
    "Iote's Shield": {
        slot: "A",
        description: 'Neutralizes "effective against flying" bonuses.',
        protects: ["flier"],
        allowedMovementTypes: ["flier"]
    },
    "Recover Ring": {
        description: "At start of turn, restores 10 HP. (Skill cannot be inherited.)",
        exclusiveTo: ["Arvis: Emperor of Flame"],
        slot: "B",
        onTurnStart() {
            renewal(this, true, 10);
        },
    },
    "Resistance +1": {
        description: "Grants Resistance +1.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").res++;
        },
    },
    "Resistance +2": {
        description: "Grants Resistance +2.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").res += 2;
        },
    },
    "Resistance +3": {
        description: "Grants Resistance +3.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").res += 3;
        },
    },
    "Sacae's Blessing": {
        description: "If foe uses sword, lance, or axe, foe cannot counterattack. (Skill cannot be inherited.)",
        slot: "A",
        exclusiveTo: ["Lyn: Brave Lady"],
        onCombatInitiate(state, target) {
            if (["sword", "axe", "lance"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Speed +1": {
        description: "Grants Speed +1.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd++;
        },
    },
    "Speed +2": {
        description: "Grants Speed +2.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd += 2;
        },
    },
    "Speed +3": {
        description: "Grants Speed +3.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd += 3;
        },
    },
    "Svalinn Shield": {
        slot: "A",
        protects: ["armored"],
        allowedMovementTypes: ["armored"],
        description: 'Neutralizes "effective against armor" bonuses.',
    },
    "Spd/Def 1": {
        description: "Grants Spd/Def+1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").spd++;
            this.entity.getOne("Stats").def++;
        }
    },
    "Spd/Def 2": {
        description: "Grants Spd/Def+2.",
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd += 2;
            this.entity.getOne("Stats").def += 2;
        }
    },
    "Spd/Res 1": {
        description: "Grants Spd/Res+1.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd++;
            this.entity.getOne("Stats").res++;
        }
    },
    "Spd/Res 2": {
        description: "Grants Spd/Res+2.",
        isSacredSeal: true,
        slot: "A",
        onEquip() {
            this.entity.getOne("Stats").spd += 2;
            this.entity.getOne("Stats").res += 2;
        }
    },
    "Atk/Spd 1": {
        description: "Grants Atk/Spd+1.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk++;
            this.entity.getOne("Stats").res++;
        }
    },
    "Atk/Spd 2": {
        description: "Grants Atk/Spd+2.",
        slot: "A",
        isSacredSeal: true,
        onEquip() {
            this.entity.getOne("Stats").atk += 2;
            this.entity.getOne("Stats").res += 2;
        }
    },
    "Close Def 1": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+2 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 2,
                    res: 2
                });
            }
        },
    },
    "Close Def 2": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+4 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 4,
                    res: 4
                });
            }
        },
    },
    "Close Def 3": {
        description: "If foe initiates combat and uses sword, lance, axe, dragonstone, or beast damage, grants Def/Res+6 during combat.",
        slot: "A",
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 1) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 6,
                    res: 6
                });
            }
        },
    },
    "Distant Def 1": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+2 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 2,
                    res: 2
                });
            }
        },
    },
    "Distant Def 2": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+4 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 4,
                    res: 4
                });
            }
        },
    },
    "Distant Def 3": {
        description: "If foe initiates combat and uses bow, dagger, magic, or staff, grants Def/Res+6 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatDefense(state, attacker) {
            const { range } = attacker.getOne("Weapon");
            if (range === 2) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 6,
                    res: 6
                });
            }
        },
    },
    "Guard 1": {
        slot: "B",
        description: "At start of combat, if unit's HP = 100%, inflicts Special cooldown charge -1 on foe per attack. (Only highest value applied. Does not stack.)",
        onCombatRoundDefense(target) {
            const { maxHP } = this.entity.getOne("Stats");
            const { value: hp } = this.entity.getOne("StartingHP");

            if (hp === maxHP) {
                target.addComponent({
                    type: "SlowSpecial"
                });
            }
        }
    },
    "Guard 2": {
        slot: "B",
        description: "At start of combat, if unit's HP ≥ 90%, inflicts Special cooldown charge -1 on foe per attack. (Only highest value applied. Does not stack.)",
        onCombatRoundDefense(target) {
            const { maxHP } = this.entity.getOne("Stats");
            const { value: hp } = this.entity.getOne("StartingHP");

            if (hp / maxHP >= 0.9) {
                target.addComponent({
                    type: "SlowSpecial"
                });
            }
        }
    },
    "Guard 3": {
        slot: "B",
        description: "At start of combat, if unit's HP ≥ 80%, inflicts Special cooldown charge -1 on foe per attack. (Only highest value applied. Does not stack.)",
        onCombatRoundDefense(target) {
            const { maxHP } = this.entity.getOne("Stats");
            const { value: hp } = this.entity.getOne("StartingHP");

            if (hp / maxHP >= 0.8) {
                target.addComponent({
                    type: "SlowSpecial"
                });
            }
        }
    },
    "Wrath 1": {
        slot: "B",
        description: "At start of turn, if unit's HP ≤ 25% and unit's attack can trigger their Special, grants Special cooldown count-1, and deals +10 damage when Special triggers.",
        onTurnStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.25) {
                this.entity.addComponent({
                    type: "ModifySpecialCooldown",
                    value: -1
                });
            }
        },
        allowedMovementTypes: ["infantry", "armored"],
        allowedWeaponTypes: closeRange,
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            const { hp, maxHP } = this.entity.getOne("Stats");
            const specialData = SPECIALS[special.name];
            if (hp / maxHP <= 0.25 && specialData.onCombatRoundAttack) {
                this.entity.addComponent({
                    type: "RoundDamageIncrease",
                    amount: 10
                });
            }
        }
    },
    "Wrath 2": {
        slot: "B",
        description: "At start of turn, if unit's HP ≤ 50% and unit's attack can trigger their Special, grants Special cooldown count-1, and deals +10 damage when Special triggers.",
        allowedWeaponTypes: closeRange,
        allowedMovementTypes: ["infantry", "armored"],
        onTurnStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "ModifySpecialCooldown",
                    value: -1
                });
            }
        },
        onSpecialTrigger() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const special = this.entity.getOne("Special");
            const specialData = SPECIALS[special.name];
            if (hp / maxHP <= 0.5 && specialData.onCombatRoundAttack) {
                this.entity.addComponent({
                    type: "RoundDamageIncrease",
                    amount: 10
                });
            }
        }
    },
    "Wrath 3": {
        slot: "B",
        allowedWeaponTypes: closeRange,
        allowedMovementTypes: ["infantry", "armored"],
        description: "At start of turn, if unit's HP ≤ 75% and unit's attack can trigger their Special, grants Special cooldown count-1, and deals +10 damage when Special triggers.",
        onTurnStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.75) {
                this.entity.addComponent({
                    type: "ModifySpecialCooldown",
                    value: -1
                });
            }
        },
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            const specialData = SPECIALS[special.name];
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp / maxHP <= 0.75 && specialData.onCombatRoundAttack) {
                this.entity.addComponent({
                    type: "RoundDamageIncrease",
                    amount: 10
                });
            }

        }
    },
    "Obstruct 1": {
        description: "If unit's HP ≥ 90%, foes cannot move through spaces adjacent to unit. (Does not affect foes with Pass skills.)",
        slot: "B",
        isSacredSeal: true,
        onTurnEnemyCheckRange(state, enemy) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.9) {
                const { x, y } = this.entity.getOne("Position");
                const surroundings = getSurroundings(state.map, y, x);
                for (let tile of surroundings) {
                    const { x: tileX, y: tileY } = getTileCoordinates(tile);
                    enemy.addComponent({
                        type: "Obstruct",
                        x: tileX,
                        y: tileY
                    });
                }
            }
        },
    },
    "Obstruct 2": {
        description: "If unit's HP ≥ 70%, foes cannot move through spaces adjacent to unit. (Does not affect foes with Pass skills.)",
        slot: "B",
        isSacredSeal: true,
        onTurnEnemyCheckRange(state, enemy) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.7) {
                const { x, y } = this.entity.getOne("Position");
                const surroundings = getSurroundings(state.map, y, x);
                for (let tile of surroundings) {
                    const { x: tileX, y: tileY } = getTileCoordinates(tile);
                    enemy.addComponent({
                        type: "Obstruct",
                        x: tileX,
                        y: tileY
                    });
                }
            }
        },
    },
    "Obstruct 3": {
        description: "If unit's HP ≥ 50%, foes cannot move through spaces adjacent to unit. (Does not affect foes with Pass skills.)",
        slot: "B",
        isSacredSeal: true,
        onTurnEnemyCheckRange(state, enemy) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                const { x, y } = this.entity.getOne("Position");
                const surroundings = getSurroundings(state.map, y, x);
                for (let tile of surroundings) {
                    const { x: tileX, y: tileY } = getTileCoordinates(tile);
                    enemy.addComponent({
                        type: "Obstruct",
                        x: tileX,
                        y: tileY
                    });
                }
            }
        },
    },
    "Dazzling Staff 1": {
        allowedWeaponTypes: ["staff"],
        slot: "B",
        description: "At start of combat, if unit's HP = 100%, foe cannot counterattack.",
        onCombatInitiate() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (maxHP === hp) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        }
    },
    "Dazzling Staff 2": {
        allowedWeaponTypes: ["staff"],
        slot: "B",
        description: "At start of combat, if unit's HP ≥ 50%, foe cannot counterattack.",
        onCombatInitiate() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        }
    },
    "Dazzling Staff 3": {
        allowedWeaponTypes: ["staff"],
        slot: "B",
        description: "Foe cannot counterattack.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "PreventCounterattack"
            });
        }
    },
    "Wrathful Staff 1": {
        allowedWeaponTypes: ["staff"],
        description: "At start of combat, if unit's HP = 100%, calculates damage from staff like other weapons.",
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "NormalizeStaffDamage"
                });
            }
        },
        slot: "B",
    },
    "Wrathful Staff 2": {
        allowedWeaponTypes: ["staff"],
        description: "At start of combat, if unit's HP = 100%, calculates damage from staff like other weapons.",
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "NormalizeStaffDamage"
                });
            }
        },
        slot: "B",
    },
    "Wrathful Staff 3": {
        allowedWeaponTypes: ["staff"],
        description: "At start of combat, if unit's HP = 100%, calculates damage from staff like other weapons.",
        onCombatStart() {
            this.entity.addComponent({
                type: "NormalizeStaffDamage"
            });
        },
        slot: "B",
    },
    "Vantage 1": {
        slot: "B",
        description: "If unit's HP ≤ 25% and foe initiates combat, unit can counterattack before foe's first attack.",
        onCombatDefense() {
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp / maxHP <= 0.25) {
                this.entity.addComponent({
                    type: "Vantage"
                });
            }
        }
    },
    "Vantage 2": {
        slot: "B",
        description: "If unit's HP ≤ 50% and foe initiates combat, unit can counterattack before foe's first attack.",
        onCombatDefense() {
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "Vantage"
                });
            }
        }
    },
    "Vantage 3": {
        slot: "B",
        description: "If unit's HP ≤ 75% and foe initiates combat, unit can counterattack before foe's first attack.",
        onCombatDefense() {
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp / maxHP <= 0.75) {
                this.entity.addComponent({
                    type: "Vantage"
                });
            }
        }
    },
    "Atk/Def Bond 1": {
        description: "If unit is adjacent to an ally, grants Atk/Def+3 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 3,
                def: 3
            });
        }
    },
    "Atk/Def Bond 2": {
        description: "If unit is adjacent to an ally, grants Atk/Def+4 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 4,
                def: 4
            });
        }
    },
    "Atk/Def Bond 3": {
        description: "If unit is adjacent to an ally, grants Atk/Def+5 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 5,
                def: 5
            });
        }
    },
    "Atk/Res Bond 1": {
        description: "If unit is adjacent to an ally, grants Atk/Res+3 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 3,
                res: 3
            });
        }
    },
    "Atk/Res Bond 2": {
        description: "If unit is adjacent to an ally, grants Atk/Res+4 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 4,
                res: 4
            });
        }
    },
    "Atk/Res Bond 3": {
        description: "If unit is adjacent to an ally, grants Atk/Res+5 during combat.",
        slot: "A",
        isSacredSeal: true,
        onCombatStart(state) {
            bond(this, state, {
                atk: 5,
                res: 5
            });
        }
    },
    "Death Blow 1": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Atk+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2
            });
        }
    },
    "Death Blow 2": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Atk+4 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4
            });
        }
    },
    "Death Blow 3": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Atk+6 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 6
            });
        }
    },
    "Darting Blow 1": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Spd+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 2
            });
        }
    },
    "Darting Blow 2": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Spd+4 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 4
            });
        }
    },
    "Darting Blow 3": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Spd+6 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 6
            });
        }
    },
    "Armored Blow 1": {
        slot: "A",
        description: "If unit initiates combat, grants Def+2 during combat.",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 2
            });
        },
        isSacredSeal: true,
    },
    "Armored Blow 2": {
        slot: "A",
        description: "If unit initiates combat, grants Def+4 during combat.",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 4
            });
        },
        isSacredSeal: true,
    },
    "Armored Blow 3": {
        slot: "A",
        isSacredSeal: true,
        description: "If unit initiates combat, grants Def+6 during combat.",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 6
            });
        }
    },
    "Warding Blow 1": {
        description: "If unit initiates combat, grants Res+2 during combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "A",
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 2
            });
        }
    },
    "Warding Blow 2": {
        description: "If unit initiates combat, grants Res+4 during combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 4
            });
        }
    },
    "Warding Blow 3": {
        description: "If unit initiates combat, grants Res+6 during combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 6
            });
        }
    },
    "Fierce Stance 1": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If foe initiates combat, grants Atk+2 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2
            });
        },
    },
    "Fierce Stance 2": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If foe initiates combat, grants Atk+4 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4
            });
        },
    },
    "Fierce Stance 3": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If foe initiates combat, grants Atk+6 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 6
            });
        },
    },
    "Steady Stance 1": {
        slot: "A",
        isSacredSeal: true,
        description: "If foe initiates combat, grants Def+2 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 2
            });
        },
    },
    "Steady Stance 2": {
        slot: "A",
        isSacredSeal: true,
        description: "If foe initiates combat, grants Def+4 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 4
            });
        },
    },
    "Steady Stance 3": {
        slot: "A",
        isSacredSeal: true,
        description: "If foe initiates combat, grants Def+6 during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 6
            });
        },
    },
    "Bracing Blow 1": {
        description: "If unit initiates combat, grants Def/Res+2 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 2,
                res: 2
            });
        },
    },
    "Bracing Blow 2": {
        description: "If unit initiates combat, grants Def/Res+4 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 4,
                res: 4
            });
        },
    },
    "Steady Blow 1": {
        description: "If unit initiates combat, grants Spd/Def+2 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 2,
                def: 2
            });
        }
    },
    "Steady Blow 2": {
        description: "If unit initiates combat, grants Spd/Def+4 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 4,
                def: 4
            });
        }
    },
    "Sturdy Blow 1": {
        description: "If unit initiates combat, grants Atk/Def+2 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 2,
                def: 2
            });
        }
    },
    "Sturdy Blow 2": {
        description: "If unit initiates combat, grants Atk/Def+4 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 4,
                def: 4
            });
        }
    },
    "Swift Strike 1": {
        description: "If unit initiates combat, grants Spd/Res+2 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                spd: 2,
                res: 2
            });
        }
    },
    "Swift Strike 2": {
        description: "If unit initiates combat, grants Spd/Res+4 during combat.",
        slot: "A",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onCombatInitiate() {
            this.entity.addComponent({
                spd: 4,
                res: 4
            });
        }
    },
    "Mirror Strike 1": {
        description: "If unit initiates combat, grants Atk/Res+2 during combat.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 2,
                res: 2
            });
        }
    },
    "Mirror Strike 2": {
        description: "If unit initiates combat, grants Atk/Res+4 during combat.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        slot: "A",
        onCombatInitiate() {
            this.entity.addComponent({
                atk: 4,
                res: 4
            });
        }
    },
    "Swift Sparrow 1": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Atk/Spd+2 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2,
                spd: 2
            });
        }
    },
    "Swift Sparrow 2": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit initiates combat, grants Atk/Spd+3 during combat.",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                spd: 4
            });
        }
    },
    "Mirror Stance 1": {
        description: "If foe initiates combat, grants Atk/Res+2 during combat.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 2,
                res: 2
            });
        },
        slot: "A"
    },
    "Mirror Stance 2": {
        description: "If foe initiates combat, grants Atk/Res+4 during combat.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                res: 4
            });
        },
        slot: "A"
    },
    "Water Boost 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 2
            });
        },
    },
    "Water Boost 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 4
            });
        },
    },
    "Water Boost 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Res+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                res: 6
            });
        },
    },
    "Wind Boost 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 2
            });
        },
    },
    "Wind Boost 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 4
            });
        },
    },
    "Wind Boost 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Spd+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                spd: 6
            });
        },
    },
    "Earth Boost 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 2
            });
        },
    },
    "Earth Boost 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 4
            });
        },
    },
    "Earth Boost 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Def+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                def: 6
            });
        },
    },
    "Fire Boost 1": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+2 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 2
            });
        },
    },
    "Fire Boost 2": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+4 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 4
            });
        },
    },
    "Fire Boost 3": {
        slot: "A",
        description: "At start of combat, if unit's HP ≥ foe's HP+3, grants Atk+6 during combat.",
        onCombatStart(state, target) {
            elementalBoost(this, target, {
                atk: 6
            });
        },
    },
    "Grani's Shield": {
        slot: "A",
        description: 'Neutralizes "effective against cavalry" bonuses.',
        protects: ["cavalry"],
        allowedMovementTypes: ["cavalry"]
    },
    "Life and Death 1": {
        description: "Grants Atk/Spd+3. Inflicts Def/Res-3.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 3;
            stats.spd += 3;
            stats.def -= 3;
            stats.res -= 3;
        }
    },
    "Life and Death 2": {
        description: "Grants Atk/Spd+4. Inflicts Def/Res-4.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 4;
            stats.spd += 4;
            stats.def -= 4;
            stats.res -= 4;
        }
    },
    "Life and Death 3": {
        description: "Grants Atk/Spd+5. Inflicts Def/Res-5.",
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.atk += 5;
            stats.spd += 5;
            stats.def -= 5;
            stats.res -= 5;
        }
    },
    "Gale Dance 1": {
        description: "If Sing or Dance is used, grants Spd+2 to target.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    spd: 2
                });
            }
        },
        slot: "B"
    },
    "Gale Dance 2": {
        description: "If Sing or Dance is used, grants Spd+3 to target.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    spd: 3
                });
            }
        },
        slot: "B"
    },
    "Gale Dance 3": {
        description: "If Sing or Dance is used, grants Spd+4 to target.",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    spd: 4
                });
            }
        },
        slot: "B"
    },
    "Blaze Dance 1": {
        description: "If Sing or Dance is used, grants Atk+2 to target.",
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    atk: 2
                });
            }
        },
        isSacredSeal: true,
        slot: "B"
    },
    "Blaze Dance 2": {
        description: "If Sing or Dance is used, grants Atk+3 to target.",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    atk: 3
                });
            }
        },
        slot: "B"
    },
    "Blaze Dance 3": {
        description: "If Sing or Dance is used, grants Atk+4 to target.",
        allowedWeaponTypes: exceptStaves,
        isSacredSeal: true,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    atk: 4
                });
            }
        },
        slot: "B"
    },
    "Torrent Dance 1": {
        description: "If Sing or Dance is used, grants Res+3 to target.",
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    res: 3
                });
            }
        },
        slot: "B"
    },
    "Geyser Dance 2": {
        description: "If Sing or Dance is used, grants Def/Res+3 to target.",
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    def: 3,
                    res: 3
                });
            }
        },
        slot: "B"
    },
    "Geyser Dance 3": {
        description: "If Sing or Dance is used, grants Def/Res+4 to target.",
        allowedWeaponTypes: exceptStaves,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    def: 4,
                    res: 4
                });
            }
        },
        slot: "B"
    },
    "Seal Def 1": {
        description: "Inflicts Def-3 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                def: -3
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Def 2": {
        description: "Inflicts Def-5 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                def: -5
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Def 3": {
        description: "Inflicts Def-7 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                def: -7
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Res 1": {
        description: "Inflicts Res-3 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                res: -3
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Res 2": {
        description: "Inflicts Res-5 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                res: -5
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Res 3": {
        description: "Inflicts Res-7 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                res: -7
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Spd 1": {
        description: "Inflicts Spd-3 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                spd: -3
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Spd 2": {
        description: "Inflicts Spd-5 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                spd: -5
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Spd 3": {
        description: "Inflicts Spd-7 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                spd: -7
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Atk/Def 1": {
        description: "Inflicts Atk/Def-3 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                atk: -3,
                def: -3
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Atk/Def 2": {
        description: "Inflicts Atk/Def-5 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                atk: -5,
                def: -5
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Atk/Spd 1": {
        description: "Inflicts Atk/Spd-3 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                atk: -3,
                spd: -3
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Seal Atk/Spd 2": {
        description: "Inflicts Atk/Spd-5 on foe through its next action after combat.",
        slot: "B",
        onCombatAfter(state, target) {
            applyMapComponent(target, "MapDebuff", {
                atk: -5,
                spd: -5
            }, this.entity);
        },
        allowedWeaponTypes: exceptStaves,
    },
    "Live to Serve 1": {
        description: "When healing an ally with a staff, restores HP to unit = 50% of HP restored to target.",
        isSacredSeal: true,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            let totalHealing = 0;
            if (assist.type.includes("healing")) {
                ally.getComponents("Heal").forEach((component) => {
                    totalHealing += component.value;
                });

                this.entity.addComponent({
                    type: "Heal",
                    value: Math.floor(totalHealing / 2)
                });
            }
        },
        slot: "B",
        allowedWeaponTypes: ["staff"]
    },
    "Live to Serve 2": {
        description: "When healing an ally with a staff, restores HP to unit = 75% of HP restored to target.",
        isSacredSeal: true,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            let totalHealing = 0;
            if (assist.type.includes("healing")) {
                ally.getComponents("Heal").forEach((component) => {
                    totalHealing += component.value;
                });

                this.entity.addComponent({
                    type: "Heal",
                    value: Math.floor(totalHealing * 3 / 4)
                });
            }
        },
        slot: "B",
        allowedWeaponTypes: ["staff"]
    },
    "Live to Serve 3": {
        description: "When healing an ally with a staff, restores HP to unit = HP restored to target.",
        isSacredSeal: true,
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            let totalHealing = 0;
            if (assist.type.includes("healing")) {
                ally.getComponents("Heal").forEach((component) => {
                    totalHealing += component.value;
                });

                this.entity.addComponent({
                    type: "Heal",
                    value: totalHealing
                });
            }
        },
        slot: "B",
        allowedWeaponTypes: ["staff"]
    },
    "Flashing Blade 1": {
        slot: "A",
        isSacredSeal: true,
        allowedMovementTypes: ["armored", "infantry"],
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Spd ≥ foe's Spd+5, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);
            if (spd >= enemySpd + 5) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Flashing Blade 2": {
        slot: "A",
        isSacredSeal: true,
        allowedMovementTypes: ["armored", "infantry"],
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Spd ≥ foe's Spd+3, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);
            if (spd >= enemySpd + 3) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Flashing Blade 3": {
        slot: "A",
        isSacredSeal: true,
        allowedMovementTypes: ["armored", "infantry"],
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Spd > foe's Spd, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);
            if (spd > enemySpd) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Heavy Blade 1": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Atk ≥ foe's Atk+5, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { atk } = getCombatStats(this.entity);
            const { atk: enemyAtk } = getCombatStats(target);
            if (atk >= enemyAtk + 5) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Heavy Blade 2": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Atk ≥ foe's Atk+3, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { atk } = getCombatStats(this.entity);
            const { atk: enemyAtk } = getCombatStats(target);
            if (atk >= enemyAtk + 3) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Heavy Blade 3": {
        slot: "A",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        description: "If unit's Atk > foe's Atk, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onCombatRoundAttack(target) {
            const { atk } = getCombatStats(this.entity);
            const { atk: enemyAtk } = getCombatStats(target);
            if (atk > enemyAtk) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Steady Breath": {
        slot: "A",
        isSacredSeal: true,
        description: "If foe initiates combat, grants Def+4 during combat and Special cooldown charge +1 per attack. (Only highest value applied. Does not stack.)",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 4
            });
        },
        onCombatRoundDefense() {
            if (!this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
        allowedMovementTypes: ["armored", "infantry"],
        allowedWeaponTypes: closeRange
    },
    "Desperation 1": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit's HP ≤ 25% and unit initiates combat, unit can make a follow-up attack before foe can counterattack.",
        onCombatInitiate() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.25) {
                this.entity.addComponent({
                    type: "Desperation"
                });
            }
        }
    },
    "Desperation 2": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit's HP ≤ 50% and unit initiates combat, unit can make a follow-up attack before foe can counterattack.",
        onCombatInitiate() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "Desperation"
                });
            }
        }
    },
    "Desperation 3": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit's HP ≤ 75% and unit initiates combat, unit can make a follow-up attack before foe can counterattack.",
        onCombatInitiate() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.75) {
                this.entity.addComponent({
                    type: "Desperation"
                });
            }
        }
    },
    "Brash Assault 1": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit initiates combat against a foe that can counter and unit's HP ≤ 30%, unit makes a guaranteed follow-up attack.",
        onCombatInitiate(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (defenderCanDefend(this.entity, target) && hp / maxHP <= 0.3) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
    },
    "Brash Assault 2": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit initiates combat against a foe that can counter and unit's HP ≤ 40%, unit makes a guaranteed follow-up attack.",
        onCombatInitiate(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (defenderCanDefend(this.entity, target) && hp / maxHP <= 0.4) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
    },
    "Brash Assault 3": {
        slot: "B",
        isSacredSeal: true,
        description: "If unit initiates combat against a foe that can counter and unit's HP ≤ 50%, unit makes a guaranteed follow-up attack.",
        onCombatInitiate(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (defenderCanDefend(this.entity, target) && hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
    },
    "Escape Route 1": {
        slot: "B",
        description: "If unit's HP ≤ 30%, unit can move to a space adjacent to any ally.",
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.3) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Escape Route 2": {
        slot: "B",
        description: "If unit's HP ≤ 40%, unit can move to a space adjacent to any ally.",
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.4) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Escape Route 3": {
        slot: "B",
        description: "If unit's HP ≤ 50%, unit can move to a space adjacent to any ally.",
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.5) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Flier Formation 1": {
        description: "If unit's HP = 100%, unit can move to a space adjacent to a flying ally within 2 spaces.",
        slot: "B",
        isSacredSeal: true,
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp === maxHP) {
                const allies = getAllies(state, this.entity).filter((ally) => ally.getOne("MovementType").value === "flier" && HeroSystem.getDistance(ally, this.entity) <= 2);
                for (let ally of allies) {
                    guidance(ally, state, this.entity);
                }
            }
        },
        allowedMovementTypes: ["flier"],
    },
    "Flier Formation 2": {
        description: "If unit's HP ≥ 50%, unit can move to a space adjacent to a flying ally within 2 spaces.",
        slot: "B",
        isSacredSeal: true,
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                const allies = getAllies(state, this.entity).filter((ally) => ally.getOne("MovementType").value === "flier" && HeroSystem.getDistance(ally, this.entity) <= 2);
                for (let ally of allies) {
                    guidance(ally, state, this.entity);
                }
            }
        },
        allowedMovementTypes: ["flier"],
    },
    "Flier Formation 3": {
        description: "Unit can move to a space adjacent to a flying ally within 2 spaces.",
        slot: "B",
        isSacredSeal: true,
        onTurnCheckRange(state) {
            const allies = getAllies(state, this.entity).filter((ally) => ally.getOne("MovementType").value === "flier" && HeroSystem.getDistance(ally, this.entity) <= 2);
            for (let ally of allies) {
                guidance(ally, state, this.entity);
            }
        },
        allowedMovementTypes: ["flier"],
    },
    "Wings of Mercy 1": {
        slot: "B",
        description: "If an ally's HP ≤ 30%, unit can move to a space adjacent to that ally.",
        onTurnCheckRange(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                const { hp, maxHP } = ally.getOne("Stats");
                if (hp / maxHP <= 0.3) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Wings of Mercy 2": {
        slot: "B",
        description: "If an ally's HP ≤ 40%, unit can move to a space adjacent to that ally.",
        onTurnCheckRange(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                const { hp, maxHP } = ally.getOne("Stats");
                if (hp / maxHP <= 0.4) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Wings of Mercy 3": {
        slot: "B",
        description: "If an ally's HP ≤ 50%, unit can move to a space adjacent to that ally.",
        onTurnCheckRange(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                const { hp, maxHP } = ally.getOne("Stats");
                if (hp / maxHP <= 0.5) {
                    guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Pass 1": {
        description: "If unit's HP ≥ 75%, unit can move through foes' spaces.",
        slot: "B",
        onTurnCheckRange() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.75) {
                this.entity.addComponent({
                    type: "Pass"
                });
            }
        }
    },
    "Pass 2": {
        description: "If unit's HP ≥ 50%, unit can move through foes' spaces.",
        slot: "B",
        onTurnCheckRange() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "Pass"
                });
            }
        }
    },
    "Pass 3": {
        description: "If unit's HP ≥ 25%, unit can move through foes' spaces.",
        slot: "B",
        onTurnCheckRange() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.25) {
                this.entity.addComponent({
                    type: "Pass"
                });
            }
        }
    },
    "Poison Strike 1": {
        description: "If unit initiates combat, deals 4 damage to foe after combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "B",
        isSacredSeal: true,
        onCombatAfter(state, target) {
            if (this.entity.getOne("InitiateCombat")) {
                target.addComponent({
                    type: "MapDamage",
                    value: 4
                });
            }
        },
    },
    "Poison Strike 2": {
        description: "If unit initiates combat, deals 7 damage to foe after combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "B",
        isSacredSeal: true,
        onCombatAfter(state, target) {
            if (this.entity.getOne("InitiateCombat")) {
                target.addComponent({
                    type: "MapDamage",
                    value: 7
                });
            }
        },
    },
    "Poison Strike 3": {
        description: "If unit initiates combat, deals 10 damage to foe after combat.",
        allowedWeaponTypes: exceptStaves,
        slot: "B",
        isSacredSeal: true,
        onCombatAfter(state, target) {
            if (this.entity.getOne("InitiateCombat")) {
                target.addComponent({
                    type: "MapDamage",
                    value: 10
                });
            }
        },
    },
    "Shield Pulse 1": {
        allowedMovementTypes: ["infantry", "armored"],
        allowedWeaponTypes: closeRange,
        description: "At the start of turn 1, if foe's attack can trigger unit's Special, grants Special cooldown count-1.",
        slot: "B",
        onTurnStart(state) {
            const special = this.entity.getOne("Special");
            if (state.turn === 1 && special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundDefense) {
                    this.entity.addComponent({
                        type: "ModifySpecialCooldown",
                        value: -1
                    });
                }
            }
        },
    },
    "Shield Pulse 2": {
        allowedMovementTypes: ["infantry", "armored"],
        allowedWeaponTypes: closeRange,
        description: "At the start of turn 1, if foe's attack can trigger unit's Special, grants Special cooldown count-1. Reduces damage dealt to unit by 5 when Special triggers.",
        slot: "B",
        onTurnStart(state) {
            const special = this.entity.getOne("Special");
            if (state.turn === 1 && special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundDefense) {
                    this.entity.addComponent({
                        type: "ModifySpecialCooldown",
                        value: -1
                    });
                }
            }
        },
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            const specialData = SPECIALS[special.name];
            if (specialData.onCombatRoundDefense) {
                this.entity.addComponent({
                    type: "RoundDamageReduction",
                    value: 5
                });
            }
        }
    },
    "Shield Pulse 3": {
        allowedMovementTypes: ["infantry", "armored"],
        allowedWeaponTypes: closeRange,
        description: "At the start of turn 1, if foe's attack can trigger unit's Special, grants Special cooldown count-2. Reduces damage dealt to unit by 5 when Special triggers.",
        slot: "B",
        onTurnStart(state) {
            const special = this.entity.getOne("Special");
            if (state.turn === 1 && special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundDefense) {
                    this.entity.addComponent({
                        type: "ModifySpecialCooldown",
                        value: -2
                    });
                }
            }
        },
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            const specialData = SPECIALS[special.name];
            if (specialData.onCombatRoundDefense) {
                this.entity.addComponent({
                    type: "RoundDamageReduction",
                    value: 5
                });
            }
        }
    },
    "Cancel Affinity 1": {
        slot: "B",
        allowedWeaponTypes: closeRange,
        extraAllowedWeapons: ["colorless-bow", "colorless-dagger"],
        description: "Neutralizes all weapon-triangle advantage granted by unit's and foe's skills.",
        onCombatStart(state, target) {
            this.entity.addComponent({
                type: "NeutralizeAffinity",
            });

            target.addComponent({
                type: "NeutralizeAffinity",
            });
        }
    },
    "Cancel Affinity 2": {
        slot: "B",
        allowedWeaponTypes: closeRange,
        extraAllowedWeapons: ["colorless-bow", "colorless-dagger"],
        description: "Neutralizes weapon-triangle advantage granted by unit's skills. If unit has weapon-triangle disadvantage, neutralizes weapon-triangle advantage granted by foe's skills.",
        onCombatStart(state, target) {
            target.addComponent({
                type: "NeutralizeAffinity",
            });

            if (getAffinity(target, this.entity) === 0.2) {
                this.entity.addComponent({
                    type: "NeutralizeAffinity"
                });
            }
        }
    },
    "Cancel Affinity 3": {
        slot: "B",
        extraAllowedWeapons: ["colorless-bow", "colorless-dagger"],
        allowedWeaponTypes: closeRange,
        description: "Neutralizes weapon-triangle advantage granted by unit's skills. If unit has weapon-triangle disadvantage, reverses weapon-triangle advantage granted by foe's skills.",
        onCombatStart(state, target) {
            target.addComponent({
                type: "NeutralizeAffinity",
            });

            if (getAffinity(target, this.entity) === 0.2) {
                this.entity.addComponent({
                    type: "GuaranteedAffinity"
                });
            }
        }
    },
    "Drag Back": {
        slot: "B",
        description: "If unit initiates combat, unit moves 1 space away after combat. Target foe moves to unit's previous space.",
        allowedWeaponTypes: closeRange,
        onCombatAfter(state, target) {
            const retreatChecker = retreat(state, this.entity, target);
            const { x, y } = getPosition(this.entity);
            if (retreatChecker.checker()) {
                retreatChecker.runner();
                if (canReachTile(target, state.map[y][x], true)) {
                    target.addComponent({
                        type: "Move",
                        x,
                        y
                    });
                }
            }
        },
    },
    "Hit and Run": {
        slot: "B",
        description: "If unit initiates combat, unit moves 1 space away after combat.",
        allowedWeaponTypes: closeRange,
        onCombatAfter(state, target) {
            const retreatChecker = retreat(state, this.entity, target);
            if (retreatChecker.checker()) {
                retreatChecker.runner();
            }
        },
    },
    "Knock Back": {
        description: "If unit initiates combat, target foe moves 1 space away after combat.",
        slot: "B",
        allowedWeaponTypes: closeRange,
        onCombatAfter(state, target) {
            const shoveChecker = shove(state, this.entity, target, 1);
            if (shoveChecker.checker()) {
                shoveChecker.runner();
            }
        },
    },
    "Lunge": {
        description: "If unit initiates combat, unit and target foe swap spaces after combat.",
        slot: "B",
        allowedWeaponTypes: closeRange,
        onCombatAfter(state, target) {
            const boundSwap = swap();
            if (this.entity.getOne("InitiateCombat") && boundSwap.checker(state, this.entity, target)) {
                boundSwap.runner(state, this.entity, target);
            }
        },
    },
    "Axebreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 90% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Axebreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 70% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Axebreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "axe", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["sword", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "red"],
        description: "If unit's HP ≥ 50% in combat against an axe foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Renewal 1": {
        description: "At the start of every fourth turn, restores 10 HP.",
        isSacredSeal: true,
        onTurnStart(state) {
            renewal(this, state.turn % 4 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 2": {
        description: "At the start of every third turn, restores 10 HP.",
        isSacredSeal: true,
        onTurnStart(state) {
            renewal(this, state.turn % 3 === 0, 10);
        },
        slot: "B",
    },
    "Renewal 3": {
        description: "At start of odd-numbered turns, restores 10 HP.",
        isSacredSeal: true,
        onTurnStart(state) {
            renewal(this, state.turn % 2 === 1, 10);
        },
        slot: "B",
    },
    "Daggerbreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.9);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 90% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Daggerbreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.7);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 70% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Daggerbreaker 3": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "dagger", 0.5);
            }
        },
        slot: "B",
        description: "If unit's HP ≥ 50% in combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 90% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 70% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Lancebreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "lance", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "axe", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "green", "blue"],
        description: "If unit's HP ≥ 50% in combat against a lance foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 1": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.9);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 90% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 2": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.7);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 70% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Swordbreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "sword", 0.5);
        },
        slot: "B",
        allowedWeaponTypes: ["lance", "sword", "beast", "bow", "dagger", "breath", "tome", "staff"],
        allowedColors: ["colorless", "red", "blue"],
        description: "If unit's HP ≥ 50% in combat against a sword foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "R Tomebreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "red") {
                breaker(this, target, "tome", 0.9);
            }
        },
        slot: "B",
        allowedColors: ["red", "blue", "colorless"],
        description: "If unit's HP ≥ 90% in combat against a red tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "R Tomebreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "red") {
                breaker(this, target, "tome", 0.7);
            }
        },
        slot: "B",
        allowedColors: ["red", "blue", "colorless"],
        description: "If unit's HP ≥ 70% in combat against a red tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "R Tomebreaker 3": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "red") {
                breaker(this, target, "tome", 0.5);
            }
        },
        slot: "B",
        allowedColors: ["red", "blue", "colorless"],
        description: "If unit's HP ≥ 50% in combat against a red tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "B Tomebreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "blue") {
                breaker(this, target, "tome", 0.9);
            }
        },
        slot: "B",
        allowedColors: ["blue", "green", "colorless"],
        description: "If unit's HP ≥ 90% in combat against a blue tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "B Tomebreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "blue") {
                breaker(this, target, "tome", 0.7);
            }
        },
        slot: "B",
        allowedColors: ["blue", "green", "colorless"],
        description: "If unit's HP ≥ 70% in combat against a blue tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "B Tomebreaker 3": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "blue") {
                breaker(this, target, "tome", 0.5);
            }
        },
        allowedColors: ["blue", "green", "colorless"],
        slot: "B",
        description: "If unit's HP ≥ 50% in combat against a blue tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "G Tomebreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "green") {
                breaker(this, target, "tome", 0.9);
            }
        },
        slot: "B",
        allowedColors: ["red", "green", "colorless"],
        description: "If unit's HP ≥ 90% in combat against a green tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "G Tomebreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "green") {
                breaker(this, target, "tome", 0.7);
            }
        },
        slot: "B",
        allowedColors: ["red", "green", "colorless"],
        description: "If unit's HP ≥ 70% in combat against a green tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "G Tomebreaker 3": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "green") {
                breaker(this, target, "tome", 0.5);
            }
        },
        allowedColors: ["red", "green", "colorless"],
        slot: "B",
        description: "If unit's HP ≥ 50% in combat against a green tome foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 1": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "bow", 0.9);
            }
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 90% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 2": {
        onCombatStart(state, target) {
            if (target.getOne("Weapon").color === "colorless") {
                breaker(this, target, "bow", 0.7);
            }
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 70% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Bowbreaker 3": {
        onCombatStart(state, target) {
            breaker(this, target, "bow", 0.5);
        },
        slot: "B",
        allowedMovementTypes: ["armored", "cavalry", "infantry"],
        description: "If unit's HP ≥ 50% in combat against a colorless bow foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack."
    },
    "Defiant Atk 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 3);
        }
    },
    "Defiant Atk 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 5);
        }
    },
    "Defiant Atk 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Atk+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "atk", 7);
        }
    },
    "Defiant Def 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 3);
        }
    },
    "Defiant Def 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 5);
        }
    },
    "Defiant Def 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Def+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "def", 7);
        }
    },
    "Defiant Spd 1": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 3);
        }
    },
    "Defiant Spd 2": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 5);
        }
    },
    "Defiant Spd 3": {
        slot: "A",
        isSacredSeal: true,
        description: "At start of turn, if unit's HP ≤ 50%, grants Spd+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "spd", 7);
        }
    },
    "Defiant Res 1": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+3 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 3);
        }
    },
    "Defiant Res 2": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+5 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 5);
        }
    },
    "Defiant Res 3": {
        slot: "A",
        description: "At start of turn, if unit's HP ≤ 50%, grants Res+7 for 1 turn.",
        onTurnStart() {
            defiant(this, "res", 7);
        }
    },
    "Breath of Life 1": {
        slot: "C",
        isSacredSeal: true,
        description: "If unit initiates combat, restores 3 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 3
                    });
                }
            }
        }
    },
    "Breath of Life 2": {
        slot: "C",
        isSacredSeal: true,
        description: "If unit initiates combat, restores 5 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 5
                    });
                }
            }
        }
    },
    "Breath of Life 3": {
        slot: "C",
        isSacredSeal: true,
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        onCombatInitiate(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "AfterCombatHeal",
                        value: 7
                    });
                }
            }
        }
    },
    "Guidance 1": {
        slot: "C",
        isSacredSeal: true,
        description: "If unit's HP = 100%, infantry and armored allies within 2 spaces can move to a space adjacent to unit.",
        onTurnAllyCheckRange(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp === maxHP && ["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                guidance(this.entity, state, ally);
            }
        },
        allowedMovementTypes: ["flier"]
    },
    "Guidance 2": {
        slot: "C",
        isSacredSeal: true,
        description: "If unit's HP ≥ 50%, infantry and armored allies within 2 spaces can move to a space adjacent to unit. ",
        allowedMovementTypes: ["flier"],
        onTurnAllyCheckRange(state, ally) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5 && ["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                guidance(this.entity, state, ally);
            }
        }
    },
    "Guidance 3": {
        slot: "C",
        isSacredSeal: true,
        allowedMovementTypes: ["flier"],
        description: "Infantry and armored allies within 2 spaces can move to a space adjacent to unit.",
        onTurnAllyCheckRange(state, ally) {
            if (["armored", "infantry"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(ally, this.entity) <= 2) {
                guidance(this.entity, state, ally);
            }
        }
    },
    "Savage Blow 1": {
        description: "If unit initiates combat, deals 3 damage to foes within 2 spaces of target after combat.",
        isSacredSeal: true,
        slot: "C",
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                const enemies = getAllies(state, target);
                for (let enemy of enemies) {
                    if (HeroSystem.getDistance(enemy, target) <= 2) {
                        enemy.addComponent({
                            type: "MapDamage",
                            value: 3
                        });
                    }
                }
            }
        }
    },
    "Savage Blow 2": {
        description: "If unit initiates combat, deals 5 damage to foes within 2 spaces of target after combat.",
        slot: "C",
        isSacredSeal: true,
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                const enemies = getAllies(state, target);
                for (let enemy of enemies) {
                    if (HeroSystem.getDistance(enemy, target) <= 2) {
                        enemy.addComponent({
                            type: "MapDamage",
                            value: 5
                        });
                    }
                }
            }
        }
    },
    "Savage Blow 3": {
        description: "If unit initiates combat, deals 7 damage to foes within 2 spaces of target after combat.",
        slot: "C",
        isSacredSeal: true,
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                const enemies = getAllies(state, target);
                for (let enemy of enemies) {
                    if (HeroSystem.getDistance(enemy, target) <= 2) {
                        enemy.addComponent({
                            type: "MapDamage",
                            value: 7
                        });
                    }
                }
            }
        }
    },
    "Hone Atk 1": {
        description: "At start of turn, grants Atk+2 to adjacent allies for 1 turn.",
        isSacredSeal: true,
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 2);
        }
    },
    "Hone Atk 2": {
        description: "At start of turn, grants Atk+3 to adjacent allies for 1 turn.",
        isSacredSeal: true,
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 3)
        }
    },
    "Hone Atk 3": {
        description: "At start of turn, grants Atk+4 to adjacent allies for 1 turn.",
        isSacredSeal: true,
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 4);
        }
    },
    "Hone Atk 4": {
        description: "At start of turn, grants Atk+7 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "atk", 7);
        }
    },
    "Hone Spd 1": {
        description: "At start of turn, grants Spd+2 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 2);
        }
    },
    "Hone Spd 2": {
        description: "At start of turn, grants Spd+3 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 3);
        }
    },
    "Hone Spd 3": {
        description: "At start of turn, grants Spd+4 to adjacent allies for 1 turn.",
        slot: "C",
        onTurnStart(state) {
            honeStat(this, state, "spd", 4);
        }
    },
    "Hone Cavalry": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent cavalry allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onTurnStart(battleState) {
            mapBuffByMovementType(this, battleState, "cavalry", {
                atk: 6,
                spd: 6
            });
        },
    },
    "Hone Fliers": {
        description: "At start of turn, grants Atk/Spd+6 to adjacent flying allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["flier"],
        onTurnStart(battleState) {
            mapBuffByMovementType(this, battleState, "flier", {
                atk: 6,
                spd: 6
            });
        },
    },
    "Fortify Def 1": {
        description: "At start of turn, grants Def+2 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 2
                    });
                }
            }
        },
    },
    "Fortify Def 2": {
        description: "At start of turn, grants Def+3 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 3
                    });
                }
            }
        },
    },
    "Fortify Def 3": {
        description: "At start of turn, grants Def+3 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        def: 3
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Res 1": {
        description: "At start of turn, grants Res+2 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        res: 2
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Res 2": {
        description: "At start of turn, grants Res+3 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        res: 3
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Res 3": {
        description: "At start of turn, grants Res+4 to adjacent allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        res: 4
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Armor": {
        description: "At start of turn, grants Def/Res+6 to adjacent armored allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["armored"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "armored" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    ally.addComponent({
                        type: "MapBuff",
                        def: 6,
                        res: 6
                    });
                }
            }
        },
    },
    "Fortify Cavalry": {
        description: "At start of turn, grants Def/Res+6 to adjacent cavalry allies for 1 turn.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "cavalry" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        def: 6,
                        res: 6,
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Dragons": {
        description: "At start of turn, grants Def/Res+6 to adjacent dragon allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: ["breath"],
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("Weapon").weaponType === "breath" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        def: 6,
                        res: 6,
                    }, this.entity);
                }
            }
        },
    },
    "Fortify Fliers": {
        description: "At start of turn, grants Def/Res+6 to adjacent flying allies for 1 turn.",
        allowedMovementTypes: ["flier"],
        slot: "C",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (ally.getOne("MovementType").value === "flier" && HeroSystem.getDistance(ally, this.entity) === 1) {
                    applyMapComponent(ally, "MapBuff", {
                        def: 6,
                        res: 6,
                    }, this.entity);
                }
            }
        },
    },
    "Goad Fliers": {
        description: "Grants Atk/Spd+4 to flying allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["flier"],
        onCombatAllyStart: goad("flier")
    },
    "Goad Armor": {
        description: "Grants Atk/Spd+4 to armored allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["armored"],
        onCombatAllyStart: goad("armored")
    },
    "Goad Cavalry": {
        description: "Grants Atk/Spd+4 to cavalry allies within 2 spaces during combat.",
        slot: "C",
        allowedMovementTypes: ["cavalry"],
        onCombatAllyStart: goad("cavalry")
    },
    "Ward Cavalry": {
        description: "Grants Def/Res+4 to cavalry allies within 2 spaces during combat.",
        onCombatAllyStart: ward("cavalry"),
        slot: "C",
        allowedMovementTypes: ["cavalry"]
    },
    "Ward Armor": {
        description: "Grants Def/Res+4 to armored allies within 2 spaces during combat.",
        onCombatAllyStart: ward("armored"),
        slot: "C",
        allowedMovementTypes: ["armored"]
    },
    "Ward Fliers": {
        description: "Grants Def/Res+4 to flier allies within 2 spaces during combat.",
        onCombatAllyStart: ward("flier"),
        slot: "C",
        allowedMovementTypes: ["flier"]
    },
    "Panic Ploy 1": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP ≤ unit's HP-5 into penalties through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp <= hp - 5) {
                        applyMapComponent(enemy, "PanicComponent", {}, this.entity);
                    }
                }
            }
        }
    },
    "Panic Ploy 2": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP ≤ unit's HP-3 into penalties through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp <= hp - 3) {
                        applyMapComponent(enemy, "PanicComponent", {}, this.entity);
                    }
                }
            }
        }
    },
    "Panic Ploy 3": {
        description: "At start of turn, converts bonuses on foes in cardinal directions with HP < unit's HP into penalties through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            const otherTeam = getEnemies(state, this.entity);
            const { x, y } = this.entity.getOne("Position");
            const { hp } = this.entity.getOne("Stats");

            for (let enemy of otherTeam) {
                const enemyPosition = enemy.getOne("Position");
                if (enemyPosition.x === x || enemyPosition.y === y) {
                    const { hp: enemyHp } = enemy.getOne("Stats");
                    if (enemyHp < hp) {
                        applyMapComponent(enemy, "PanicComponent", {}, this.entity);
                    }
                }
            }
        }
    },
    "Atk Ploy 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Atk-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "atk", -3);
        },
    },
    "Atk Ploy 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Atk-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "atk", -4);
        },
    },
    "Atk Ploy 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Atk-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "atk", -5);
        },
    },
    "Spd Ploy 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Spd-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "spd", -3);
        },
    },
    "Spd Ploy 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Spd-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "spd", -4);
        },
    },
    "Spd Ploy 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Spd-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "spd", -5);
        },
    },
    "Def Ploy 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Def-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "def", -3);
        },
    },
    "Def Ploy 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Def-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "def", -4);
        },
    },
    "Def Ploy 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Def-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "def", -5);
        }
    },
    "Res Ploy 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Res-3 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "res", -3);
        }
    },
    "Res Ploy 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Res-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "res", -4);
        },
    },
    "Res Ploy 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, inflicts Res-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onTurnStart(state) {
            ploy(this, state, "res", -5);
        },
    },
    "Atk Tactic 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Atk+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 2);
        }
    },
    "Atk Tactic 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Atk+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 4);
        }
    },
    "Atk Tactic 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Atk+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "atk", 6);
        }
    },
    "Spd Tactic 1": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Spd+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 2);
        }
    },
    "Spd Tactic 2": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Spd+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 4);
        }
    },
    "Spd Tactic 3": {
        slot: "C",
        isSacredSeal: true,
        description: "At start of turn, grants Spd+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "spd", 6);
        }
    },
    "Def Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Def+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 2);
        }
    },
    "Def Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Def+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 4);
        }
    },
    "Def Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Def+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "def", 6);
        }
    },
    "Res Tactic 1": {
        slot: "C",
        description: "At start of turn, grants Res+2 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 2);
        }
    },
    "Res Tactic 2": {
        slot: "C",
        description: "At start of turn, grants Res+4 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 4);
        }
    },
    "Res Tactic 3": {
        slot: "C",
        description: "At start of turn, grants Res+6 to allies within 2 spaces for 1 turn. Granted only if number of that ally's movement type on current team ≤ 2.",
        onTurnStart(state) {
            tactic(this, state, "res", 6);
        }
    },
    "Odd Atk Wave 1": {
        description: "On odd turns, adds +2 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart: wave("atk", turnIsOdd, 2)
    },
    "Odd Atk Wave 2": {
        description: "On odd turns, adds +4 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart: wave("atk", turnIsOdd, 4)
    },
    "Odd Atk Wave 3": {
        description: "On odd turns, adds +6 Atk for unit and nearby allies for 1 turn.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart: wave("atk", turnIsOdd, 6)
    },
    "Wary Fighter 1": {
        slot: "B",
        allowedMovementTypes: ["armored"],
        description: "If unit's HP ≥ 90%, unit and foe cannot make a follow-up attack.",
        onCombatStart(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.9) {
                this.entity.addComponent({
                    type: "PreventFollowup"
                });
                target.addComponent({
                    type: "PreventFollowup"
                });
            }
        },
    },
    "Wary Fighter 2": {
        slot: "B",
        allowedMovementTypes: ["armored"],
        description: "If unit's HP ≥ 70%, unit and foe cannot make a follow-up attack.",
        onCombatStart(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.7) {
                this.entity.addComponent({
                    type: "PreventFollowup"
                });
                target.addComponent({
                    type: "PreventFollowup"
                });
            }
        },
    },
    "Wary Fighter 3": {
        slot: "B",
        description: "If unit's HP ≥ 50%, unit and foe cannot make a follow-up attack.",
        allowedMovementTypes: ["armored"],
        onCombatStart(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "PreventFollowup"
                });
                target.addComponent({
                    type: "PreventFollowup"
                });
            }
        },
    },
    "Quick Riposte 1": {
        description: "If unit's HP ≥ 90% and foe initiates combat, unit makes a guaranteed follow-up attack.",
        isSacredSeal: true,
        onCombatDefense() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.9) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
        slot: "B"
    },
    "Quick Riposte 2": {
        description: "If unit's HP ≥ 70% and foe initiates combat, unit makes a guaranteed follow-up attack.",
        isSacredSeal: true,
        onCombatDefense() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.7) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
        slot: "B"
    },
    "Quick Riposte 3": {
        description: "If unit's HP ≥ 50% and foe initiates combat, unit makes a guaranteed follow-up attack.",
        isSacredSeal: true,
        onCombatDefense() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
        slot: "B"
    },
    "Armor March 1": {
        slot: "C",
        isSacredSeal: true,
        allowedMovementTypes: ["armored"],
        description: "At start of turn, if unit's HP = 100% and unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.)",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (maxHP === hp) {
                let applyBuffToSelf = false;
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                        applyBuffToSelf = true;
                        ally.addComponent({
                            type: "IncreasedMovement"
                        });
                    }
                }

                if (applyBuffToSelf) {
                    this.entity.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }
        }
    },
    "Armor March 2": {
        slot: "C",
        isSacredSeal: true,
        allowedMovementTypes: ["armored"],
        description: "At start of turn, if unit's HP ≥ 50% and unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.) ",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            const { maxHP, hp } = this.entity.getOne("Stats");

            if (hp >= maxHP / 2) {
                let applyBuffToSelf = false;
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                        applyBuffToSelf = true;
                        ally.addComponent({
                            type: "IncreasedMovement"
                        });
                    }
                }

                if (applyBuffToSelf) {
                    this.entity.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }
        }
    },
    "Armor March 3": {
        slot: "C",
        isSacredSeal: true,
        allowedMovementTypes: ["armored"],
        description: "At start of turn, if unit is adjacent to an armored ally, unit and adjacent armored allies can move 1 extra space. (That turn only. Does not stack.)",
        onTurnStart(state) {
            const allies = getAllies(state, this.entity);
            let applyBuffToSelf = false;
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) === 1 && ally.getOne("MovementType").value === "armored") {
                    applyBuffToSelf = true;
                    ally.addComponent({
                        type: "IncreasedMovement"
                    });
                }
            }

            if (applyBuffToSelf) {
                this.entity.addComponent({
                    type: "IncreasedMovement"
                });
            }
        }
    },
    "Drive Def 1": {
        slot: "C",
        description: "Grants Def+2 to allies within 2 spaces during combat.",
        isSacredSeal: true,
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                def: 2,
            });
        }
    },
    "Drive Def 2": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Def+3 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                def: 3,
            });
        }
    },
    "Drive Atk 1": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Atk+2 to allies within 2 spaces during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                atk: 2
            });
        }
    },
    "Drive Atk 2": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                atk: 3
            });
        },
        isSacredSeal: true,
        slot: "C",
        description: "Grants Atk+3 to allies within 2 spaces during combat.",
    },
    "Drive Res 1": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                res: 2
            });
        },
        isSacredSeal: true,
        slot: "C",
        description: "Grants Res+2 to allies within 2 spaces during combat."
    },
    "Drive Res 2": {
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 2, {
                res: 3
            });
        },
        isSacredSeal: true,
        slot: "C",
        description: "Grants Res+3 to allies within 2 spaces during combat."
    },
    "Spur Atk 1": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Atk+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 2
            });
        }
    },
    "Spur Atk 2": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Atk+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 3
            });
        }
    },
    "Spur Atk 3": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Atk+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                atk: 4
            });
        }
    },
    "Spur Res 1": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Res+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 2
            });
        }
    },
    "Spur Res 2": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Res+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 3
            });
        }
    },
    "Spur Res 3": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Res+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                res: 4
            });
        }
    },
    "Spur Def 1": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Def+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 2,
            });
        }
    },
    "Spur Def 2": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Def+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 3,
            });
        }
    },
    "Spur Def 3": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Def+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 4,
            });
        }
    },
    "Spur Spd 1": {
        slot: "C",
        description: "Grants Spd+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                spd: 2
            });
        }
    },
    "Spur Spd 2": {
        slot: "C",
        description: "Grants Spd+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                spd: 3,
            });
        }
    },
    "Spur Spd 3": {
        slot: "C",
        description: "Grants Spd+4 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 4
                });
            }
        }
    },
    "Spur Def/Res 1": {
        description: "Grants Def/Res +2 to adjacent allies during combat.",
        slot: "C",
        isSacredSeal: true,
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 2,
                res: 2
            });
        },
    },
    "Spur Def/Res 2": {
        description: "Grants Def/Res +3 to adjacent allies during combat.",
        slot: "C",
        isSacredSeal: true,
        onCombatAllyStart(state, ally) {
            combatBuffByRange(this, ally, 1, {
                def: 3,
                res: 3
            });
        },
    },
    "Infantry Pulse 1": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit's HP-5. (Stacks with similar skills.)",
        slot: "C",
        allowedMovementTypes: ["infantry"],
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 5) {
                        ally.addComponent({
                            type: "ModifySpecialCooldown",
                            value: -1
                        });
                    }
                }
            }
        },
    },
    "Infantry Pulse 2": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit's HP-3. (Stacks with similar skills.)",
        slot: "C",
        allowedMovementTypes: ["infantry"],
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 3) {
                        ally.addComponent({
                            type: "ModifySpecialCooldown",
                            value: -1
                        });
                    }
                }
            }
        },
    },
    "Infantry Pulse 3": {
        description: "At the start of turn 1, grants Special cooldown count-1 to all infantry allies on team with HP ≤ unit's HP-5. (Stacks with similar skills.)",
        slot: "C",
        allowedMovementTypes: ["infantry"],
        onTurnStart(battleState) {
            if (battleState.turn === 1) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (ally.getOne("MovementType").value === "infantry" && ally.getOne("Stats").hp <= this.entity.getOne("Stats").hp - 5) {
                        ally.addComponent({
                            type: "ModifySpecialCooldown",
                            value: -1
                        });
                    }
                }
            }
        },
    },
    "Threaten Atk 1": {
        description: "At start of turn, inflicts Atk-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        onTurnStart(state) {
            threaten(this, state, { atk: -3 });
        }
    },
    "Threaten Atk 2": {
        description: "At start of turn, inflicts Atk-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { atk: -5 });
        }
    },
    "Threaten Atk 3": {
        description: "At start of turn, inflicts Atk-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { atk: -7 });
        }
    },
    "Threaten Def 1": {
        description: "At start of turn, inflicts Def-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { def: -3 });
        }
    },
    "Threaten Def 2": {
        description: "At start of turn, inflicts Def-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { def: -5 });
        }
    },
    "Threaten Def 3": {
        description: "At start of turn, inflicts Def-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { def: -7 });
        }
    },
    "Threaten Spd 1": {
        description: "At start of turn, inflicts Spd-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { spd: -3 });
        }
    },
    "Threaten Spd 2": {
        description: "At start of turn, inflicts Spd-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { spd: -5 });
        }
    },
    "Threaten Spd 3": {
        description: "At start of turn, inflicts Spd-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { spd: -7 });
        }
    },
    "Threaten Res 1": {
        description: "At start of turn, inflicts Res-3 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { res: -3 });
        }
    },
    "Threaten Res 2": {
        description: "At start of turn, inflicts Res-5 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { res: -5 });
        }
    },
    "Threaten Res 3": {
        description: "At start of turn, inflicts Res-7 on foes within 2 spaces through their next actions.",
        slot: "C",
        isSacredSeal: true,
        onTurnStart(state) {
            threaten(this, state, { res: -7 });
        }
    },
    "Triangle Adept 1": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 10%. If unit has weapon-triangle disadvantage, reduces Atk by 10%.",
        allowedColors: ["red", "blue", "green"],
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 10
            });
        },
        slot: "A",
    },
    "Triangle Adept 2": {
        allowedColors: ["red", "blue", "green"],
        description: "If unit has weapon-triangle advantage, boosts Atk by 15%. If unit has weapon-triangle disadvantage, reduces Atk by 15%.",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 15
            });
        },
        slot: "A",
    },
    "Triangle Adept 3": {
        allowedColors: ["red", "blue", "green"],
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        },
        slot: "A",
    },
    "Fortress Def 1": {
        description: "Grants Def+3. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.def += 3;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "Fortress Def 2": {
        description: "Grants Def+4. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.def += 4;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "Fortress Def 3": {
        description: "Grants Def+5. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.def += 5;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "Fortress Res 1": {
        description: "Grants Res+3. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.res += 3;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "Fortress Res 2": {
        description: "Grants Res+4. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.res += 4;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "Fortress Res 3": {
        description: "Grants Res+5. Inflicts Atk-3.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.res += 5;
            stats.atk -= 3;
        },
        slot: "A"
    },
    "HP/Spd 1": {
        slot: "A",
        description: "Grants HP+3, Spd+1.",
        isSacredSeal: true,
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 3;
            stats.maxHP += 3;
            stats.spd++;
        },
    },
    "HP/Spd 2": {
        slot: "A",
        isSacredSeal: true,
        description: "Grants HP+4, Spd+2.",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 4;
            stats.maxHP += 4;
            stats.spd += 2;
        },
    },
    "HP/Def 1": {
        slot: "A",
        isSacredSeal: true,
        description: "Grants HP+3, Def+1.",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 3;
            stats.maxHP += 3;
            stats.def++;
        },
    },
    "HP/Def 2": {
        slot: "A",
        isSacredSeal: true,
        description: "Grants HP+4, Def+2.",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 4;
            stats.maxHP += 4;
            stats.def += 2;
        },
    },
    "HP/Res 1": {
        slot: "A",
        isSacredSeal: true,
        description: "Grants HP+3, Res+1.",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 3;
            stats.maxHP += 3;
            stats.res++;
        },
    },
    "HP/Res 2": {
        slot: "A",
        isSacredSeal: true,
        description: "Grants HP+4, Res+2.",
        onEquip() {
            const stats = this.entity.getOne("Stats");
            stats.hp += 4;
            stats.maxHP += 4;
            stats.res += 2;
        },
    },
    "Atk Smoke 1": {
        description: "Inflicts Atk-3 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -3
                    });
                }
            }
        },
    },
    "Atk Smoke 2": {
        description: "Inflicts Atk-5 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -5
                    });
                }
            }
        },
    },
    "Atk Smoke 3": {
        description: "Inflicts Atk-7 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        atk: -7
                    });
                }
            }
        },
    },
    "Spd Smoke 1": {
        description: "Inflicts Spd-3 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -3
                    });
                }
            }
        },
    },
    "Spd Smoke 2": {
        description: "Inflicts Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -5
                    });
                }
            }
        },
    },
    "Spd Smoke 3": {
        description: "Inflicts Spd-7 on foes within 2 spaces of target through their next actions after combat.",
        slot: "C",
        isSacredSeal: true,
        allowedWeaponTypes: exceptStaves,
        onCombatAfter(state, target) {
            const enemies = getAllies(state, target);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, target) <= 2) {
                    enemy.addComponent({
                        type: "MapDebuff",
                        spd: -7
                    });
                }
            }
        },
    },
    "Spur Spd/Def 1": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Spd/Def+2 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 2,
                    def: 2
                });
            }
        }
    },
    "Spur Spd/Def 2": {
        slot: "C",
        isSacredSeal: true,
        description: "Grants Spd/Def+3 to adjacent allies during combat.",
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) === 1) {
                ally.addComponent({
                    type: "CombatBuff",
                    spd: 3,
                    def: 3
                });
            }
        }
    },
    "Watersweep 1": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd ≥ foe's Spd+5 and foe uses magic, staff, or dragonstone damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup"
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 5 && ["breath", "tome", "staff"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Watersweep 2": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd ≥ foe's Spd+3 and foe uses magic, staff, or dragonstone damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 3 && ["breath", "tome", "staff"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Watersweep 3": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd > foe's Spd and foe uses magic, staff, or dragonstone damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd > enemySpd && ["breath", "tome", "staff"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Windsweep 1": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd ≥ foe's Spd+5 and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup"
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 5 && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Windsweep 2": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd ≥ foe's Spd+3 and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd >= enemySpd + 3 && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    },
    "Windsweep 3": {
        description: "If unit initiates combat, unit cannot make a follow-up attack. If unit's Spd > foe's Spd and foe uses sword, lance, axe, bow, dagger, or beast damage, foe cannot counterattack.",
        slot: "B",
        allowedWeaponTypes: exceptStaves,
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "PreventFollowup",
            });
            const { spd } = getCombatStats(this.entity);
            const { spd: enemySpd } = getCombatStats(target);

            if (spd > enemySpd && ["sword", "lance", "axe", "bow", "dagger", "beast"].includes(target.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "PreventCounterattack"
                });
            }
        },
    }
};

export default PASSIVES;
