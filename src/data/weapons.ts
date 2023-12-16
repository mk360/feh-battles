import Hero from "../entities/hero";
import GameState from "../systems/state";
import { WeaponColor, WeaponType } from "../weapon";
import { MovementType } from "../types";
import * as Effects from "./effects";
import Skill from "../components/skill";
import Characters from "./characters.json";
import { Entity } from "ape-ecs";
import { CombatOutcome } from "../combat";
import getEnemies from "../utils/get-enemies";
import HeroSystem from "../systems/hero";
import getAllies from "../utils/get-alies";

interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        displayName?: string;
        type: WeaponType;
        color?: WeaponColor;
        exclusiveTo?: (keyof typeof Characters)[];
        effectiveAgainst?: (MovementType | WeaponType)[];
        protects?: (MovementType | WeaponType)[];
        onCombatStart?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatAfter?(this: Skill, battleState: GameState, target: Entity, combat: CombatOutcome): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
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
            if (combat) { // TODO COMBAT API
                target.addComponent({
                    type: "MapDebuff",
                    def: -3,
                    res: -3
                });
            }
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
            if (combat) { // TODO COMBAT API
                target.addComponent({
                    type: "MapDebuff",
                    def: -3,
                    res: -3
                });
            }
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
            if (combat) { // TODO COMBAT API
                target.addComponent({
                    type: "MapDebuff",
                    def: -5,
                    res: -5
                });
            }
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
            if (combat) { // TODO COMBAT API
                target.addComponent({
                    type: "MapDebuff",
                    def: -7,
                    res: -7
                });
            }
        },
        might: 10,
        type: "dagger"
    },
    "Fire": {
        description: "",
        might: 4,
        type: "tome",
        color: "red",
    },
    "Elfire": {
        description: "",
        might: 6,
        type: "tome",
        color: "red",
    },
    "Bolganone": {
        description: "",
        might: 9,
        type: "tome",
        color: "red",
    },
    "Bolganone+": {
        description: "",
        might: 13,
        type: "tome",
        color: "red",
    },
    "Flux": {
        color: "red",
        type: "tome",
        description: "",
        might: 4
    },
    "Ruin": {
        color: "red",
        type: "tome",
        might: 6,
        description: ""
    },
    "Fenrir": {
        might: 9,
        description: "",
        type: "tome",
        color: "red"
    },
    "Fenrir+": {
        might: 13,
        type: "tome",
        color: "red",
        description: ""
    },
    "Thunder": {
        description: "",
        might: 4,
        color: "blue",
        type: "tome"
    },
    "Elthunder": {
        description: "",
        might: 6,
        color: "blue",
        type: "tome"
    },
    "Thoron": {
        description: "",
        type: "tome",
        color: "blue",
        might: 9
    },
    "Wind": {
        description: "",
        type: "tome",
        color: "green",
        might: 4
    },
    "Elwind": {
        description: "",
        type: "tome",
        color: "green",
        might: 6
    },
    "Rexcalibur": {
        description: "",
        might: 9,
        type: "tome",
        color: "green"
    },
    "Rexcalibur+": {
        description: "",
        might: 13,
        type: "tome",
        color: "green"
    },
    "Alondite": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "sword",
        onCombatStart() {
            Effects.counterattack(this);
        },
        exclusiveTo: ["Black Knight: Sinister General"]
    },
    "Arden's Blade": {
        description: "Inflicts Spd-5. Unit attacks twice. (Even if foe initiates combat, unit attacks twice.)",
        might: 10,
        type: "sword",
        exclusiveTo: ["Arden: Strong and Tough"],
        onCombatStart() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Argent Bow": {
        description: "Effective against flying foes. Inflicts Spd-2. If unit initiates combat, unit attacks twice.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.getOne("Stats").spd -= 2;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        exclusiveTo: ["Klein: Silver Nobleman"],
        might: 8,
        type: "bow",
    },
    "Armads": {
        description: "If unit's HP ≥ 80% and foe initiates combat, unit makes a guaranteed follow-up attack.",
        onCombatDefense() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.8) {
                this.entity.addComponent({
                    type: "GuaranteedFollowup"
                });
            }
        },
        type: "axe",
        might: 16,
        exclusiveTo: ["Hector: General of Ostia"]
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
    "Axe of Virility": {
        description: "Effective against armored foes.",
        might: 16,
        type: "axe",
        effectiveAgainst: ["armored"],
        exclusiveTo: ["Bartre: Fearless Warrior"]
    },
    "Beruka's Axe": {
        type: "axe",
        might: 16,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        exclusiveTo: ["Beruka: Quiet Assassin"]
    },
    "Blárblade": {
        description: "Slows Special trigger (cooldown count+1). Grants bonus to unit's Atk = total bonuses on unit during combat.",
        type: "tome",
        color: "blue",
        might: 9,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatStart() {
            Effects.blade(this);
        }
    },
    "Blárblade+": {
        description: "Slows Special trigger (cooldown count+1). Grants bonus to unit's Atk = total bonuses on unit during combat.",
        type: "tome",
        color: "blue",
        might: 13,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatStart() {
            Effects.blade(this);
        }
    },
    "Blárwolf": {
        description: "Effective against cavalry foes.",
        type: "tome",
        color: "blue",
        effectiveAgainst: ["cavalry"],
        might: 6
    },
    "Blárwolf+": {
        description: "Effective against cavalry foes.",
        type: "tome",
        color: "blue",
        effectiveAgainst: ["cavalry"],
        might: 10
    },
    "Brave Axe": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 5,
        type: "axe"
    },
    "Brave Axe+": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 8,
        type: "axe"
    },
    "Brave Bow": {
        description: "Effective against flying foes. Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 4,
        type: "bow",
    },
    "Brave Bow+": {
        description: "Effective against flying foes. Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 7,
        type: "bow",
    },
    "Brave Lance": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 5,
        type: "lance"
    },
    "Brave Lance+": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 8,
        type: "lance"
    },
    "Brave Sword": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 5,
        type: "sword"
    },
    "Brave Sword+": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 8,
        type: "sword"
    },
    "Breath of Fog": {
        description: "Effective against dragon foes. At start of odd-numbered turns, restores 10 HP. If foe's Range = 2, calculates damage using the lower of foe's Def or Res.",
        effectiveAgainst: ["breath"],
        exclusiveTo: ["Tiki: Dragon Scion"],
        type: "breath",
        might: 16,
        onTurnStart(battleState) {
            Effects.renewal(this, battleState.turn % 2 === 1, 10);
        },
        onCombatStart(battleState, target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "TargetLowestDefense"
                });
            }
        }
    },
    "Bull Blade": {
        description: "During combat, boosts unit's Atk/Def by number of allies within 2 spaces × 2. (Maximum bonus of +6 to each stat.)",
        exclusiveTo: ["Cain: The Bull"],
        type: "sword",
        might: 16,
        onCombatStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            let alliesWithinRange = 0;
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                    alliesWithinRange++;
                }
            }

            const maxBuff = Math.min(6, alliesWithinRange * 2);

            this.entity.addComponent({
                type: "CombatBuff",
                atk: maxBuff,
                def: maxBuff
            });
        }
    },
    "Crimson Axe": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "axe",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 16,
        exclusiveTo: ["Sheena: Princess of Gra"]
    },
    "Daybreak Lance": {
        description: "Accelerates Special trigger (cooldown count-1).",
        exclusiveTo: ["Lukas: Sharp Soldier"],
        type: "lance",
        might: 16,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Eckesachs": {
        description: "At start of turn, inflicts Def-4 on foes within 2 spaces through their next actions.",
        exclusiveTo: ["Zephiel: The Liberator"],
        might: 16,
        type: "sword",
        onTurnStart(battleState) {
            Effects.threaten(this, battleState, {
                def: -4
            });
        },
    },
    "Excalibur": {
        description: "Effective against flying foes.",
        effectiveAgainst: ["flier"],
        might: 14,
        exclusiveTo: ["Merric: Wind Mage"],
        type: "tome"
    },
    "Falchion (Awakening)": {
        description: "Effective against dragon foes. At the start of every third turn, restores 10 HP.",
        effectiveAgainst: ["breath"],
        might: 16,
        displayName: "Falchion",
        type: "sword",
        onTurnStart(battleState) {
            Effects.renewal(this, battleState.turn % 3 === 0, 10);
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
            Effects.renewal(this, battleState.turn % 3 === 0, 10);
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
            Effects.renewal(this, battleState.turn % 3 === 0, 10);
        },
        exclusiveTo: ["Alm: Hero of Prophecy"]
    },
    "Felicia's Plate": {
        description: "After combat, if unit attacked, inflicts Def/Res-7 on target and foes within 2 spaces through their next actions. Calculates damage using the lower of foe's Def or Res.",
        type: "dagger",
        might: 14,
        exclusiveTo: ["Felicia: Maid Mayhem"],
        onCombatStart() {
            this.entity.addComponent({
                type: "TargetLowestDefense"
            });
        },
        onCombatAfter(battleState, target, combat) {
            Effects.dagger(battleState, target, {
                def: -7,
                res: -7
            });
        },
    },
    "Firesweep Bow": {
        effectiveAgainst: ["flier"],
        description: "Effective against flying foes. Unit and foe cannot counterattack.",
        might: 7,
        type: "bow",
        onCombatStart() {
            this.entity.addComponent({
                type: "PreventCounterattack"
            });
        },
        onCombatDefense(state, attacker) {
            attacker.addComponent({
                type: "PreventCounterattack"
            });
        },
    },
    "Firesweep Bow+": {
        effectiveAgainst: ["flier"],
        description: "Effective against flying foes. Unit and foe cannot counterattack.",
        might: 11,
        type: "bow",
        onCombatStart() {
            this.entity.addComponent({
                type: "PreventCounterattack"
            });
        },
        onCombatDefense(state, attacker) {
            attacker.addComponent({
                type: "PreventCounterattack"
            });
        },
    },
    "Florina's Lance": {
        description: "Effective against armored foes.",
        might: 16,
        effectiveAgainst: ["armored"],
        type: "lance",
        exclusiveTo: ["Florina: Lovely Flier"]
    },
    "Forblaze": {
        description: "At start of turn, inflicts Res-7 on foe on the enemy team with the highest Res through its next action.",
        type: "tome",
        exclusiveTo: ["Lilina: Delightful Noble"],
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);

            const [highestRes] = enemies.sort((hero1, hero2) => hero2.getOne("Stats").res - hero1.getOne("Stats").res);

            highestRes.addComponent({
                type: "MapDebuff",
                res: -7
            });
        },
        might: 14
    },
    "Frederick's Axe": {
        description: "Effective against armored foes.",
        might: 16,
        exclusiveTo: ["Frederick: Polite Knight"],
        type: "axe",
        effectiveAgainst: ["armored"],
    },
    "Gladiator's Blade": {
        description: "If unit's Atk > foe's Atk, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        might: 16,
        type: "sword",
    },
    "Gradivus": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "lance",
        exclusiveTo: ["Camus: Sable Knight"],
        onCombatStart() {
            Effects.counterattack(this);
        }
    },
    "Gronnblade": {
        description: "Slows Special trigger (cooldown count+1). Grants bonus to unit's Atk = total bonuses on unit during combat.",
        type: "tome",
        color: "green",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatStart() {
            Effects.blade(this);
        },
        might: 9,
    },
    "Gronnblade+": {
        description: "Slows Special trigger (cooldown count+1). Grants bonus to unit's Atk = total bonuses on unit during combat.",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatStart() {
            Effects.blade(this);
        },
        type: "tome",
        color: "green",
        might: 13
    },
    "Gronnwolf": {
        effectiveAgainst: ["cavalry"],
        description: "Effective against cavalry foes.",
        might: 6,
        type: "tome",
        color: "green"
    },
    "Gronnwolf+": {
        effectiveAgainst: ["cavalry"],
        description: "Effective against cavalry foes.",
        might: 10,
        type: "tome",
        color: "green"
    },
    "Hammer": {
        description: "Effective against armored foes.",
        might: 8,
        type: "axe",
        effectiveAgainst: ["armored"],
    },
    "Hammer+": {
        description: "Effective against armored foes.",
        might: 12,
        type: "axe",
        effectiveAgainst: ["armored"],
    },
    "Hauteclere": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "axe",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 16,
        exclusiveTo: ["Michalis: Ambitious King"]
    },
    "Hana's Katana": {
        description: "Effective against armored foes.",
        might: 16,
        type: "sword",
        exclusiveTo: ["Hana: Focused Samurai"],
        effectiveAgainst: ["armored"],
    },
    "Heavy Spear": {
        description: "Effective against armored foes.",
        might: 8,
        effectiveAgainst: ["armored"],
        type: "lance"
    },
    "Heavy Spear+": {
        description: "Effective against armored foes.",
        might: 12,
        effectiveAgainst: ["armored"],
        type: "lance"
    },
    "Iris's Tome": {
        type: "tome",
        color: "green",
        exclusiveTo: ["Nino: Pious Mage"],
        might: 14,
        description: "Grants bonus to unit's Atk = total bonuses on unit during combat.",
        onCombatStart() {
            Effects.blade(this);
        }
    },
    "Killer Axe": {
        type: "axe",
        might: 7,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Killer Axe+": {
        type: "axe",
        might: 11,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Naga": {
        description: "Effective against dragon foes. If foe initiates combat, grants Def/Res+2 during combat.",
        effectiveAgainst: ["breath"],
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                def: 2,
                res: 2
            });
        },
        type: "tome",
        might: 14,
        exclusiveTo: ["Julia: Naga's Blood"]
    },
    "Oboro's Spear": {
        description: "Effective against armored foes.",
        might: 16,
        effectiveAgainst: ["armored"],
        type: "lance",
        exclusiveTo: ["Oboro: Fierce Fighter"]
    },
    "Odin's Grimoire": {
        might: 14,
        description: "Grants bonus to unit's Atk = total bonuses on unit during combat.",
        type: "tome",
        exclusiveTo: ["Odin: Potent Force"],
        onCombatStart() {
            Effects.blade(this);
        }
    },
    "Panther Lance": {
        description: "During combat, boosts unit's Atk/Def by number of allies within 2 spaces × 2. (Maximum bonus of +6 to each stat.)",
        exclusiveTo: ["Abel: The Panther"],
        type: "sword",
        might: 16,
        onCombatStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            let alliesWithinRange = 0;
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                    alliesWithinRange++;
                }
            }

            const maxBuff = Math.min(6, alliesWithinRange * 2);

            this.entity.addComponent({
                type: "CombatBuff",
                atk: maxBuff,
                def: maxBuff
            });
        }
    },
    "Parthia": {
        description: "Effective against flying foes. If unit initiates combat, grants Res+4 during combat.",
        effectiveAgainst: ["flier"],
        exclusiveTo: ["Jeorge: Perfect Shot"],
        might: 14,
        type: "bow",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 4
            });
        },
    },
    "Ragnell": {
        might: 16,
        description: "Unit can counterattack regardless of enemy range.",
        type: "sword",
        exclusiveTo: ["Ike: Young Mercenary"],
        onCombatStart() {
            Effects.counterattack(this);
        }
    },
    "Raijinto": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "sword",
        onCombatStart() {
            Effects.counterattack(this);
        },
        exclusiveTo: ["Ryoma: Peerless Samurai"]
    },
    "Renowned Bow": {
        description: "Effective against flying foes. Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        },
        might: 9,
        effectiveAgainst: ["flier"],
        exclusiveTo: ["Gordin: Altean Archer"],
        type: "bow"
    },
    "Rhomphaia": {
        effectiveAgainst: ["armored", "cavalry"],
        description: "Effective against armored and cavalry foes.",
        might: 16,
        type: "lance",
        exclusiveTo: ["Clair: Highborn Flier"]
    },
    "Sapphire Lance": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "GemWeapon"
            });
        }
    },
    "Sapphire Lance+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "GemWeapon"
            });
        }
    },
    "Siegfried": {
        description: "Unit can counterattack regardless of enemy range.",
        might: 16,
        type: "sword",
        onCombatStart() {
            Effects.counterattack(this);
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
    },
    "Stalwart Sword": {
        description: "If foe initiates combat, inflicts Atk-6 on foe during combat.",
        might: 16,
        exclusiveTo: ["Draug: Gentle Giant"],
        type: "sword",
        onCombatDefense(state, attacker) {
            attacker.addComponent({
                type: "CombatDebuff",
                atk: -6
            });
        },
    },
    "Stout Tomahawk": {
        might: 16,
        description: "Unit can counterattack regardless of enemy range.",
        type: "sword",
        exclusiveTo: ["Dorcas: Serene Warrior"],
        onCombatStart() {
            Effects.counterattack(this);
        }
    },
    "Tharja's Hex": {
        description: "Grants bonus to unit's Atk = total bonuses on unit during combat.",
        might: 14,
        exclusiveTo: ["Tharja: Dark Shadow"],
        type: "tome",
        color: "red"
    },
    "Valflame": {
        description: "At start of turn, inflicts Atk/Res-4 on foes in cardinal directions with Res < unit's Res through their next actions.",
        type: "tome",
        color: "red",
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
    "Veteran Lance": {
        description: "If foe initiates combat or, at start of combat, if foe's HP ≥ 70%, grants Atk/Res+5 to unit during combat.",
        exclusiveTo: ["Jagen: Veteran Knight"],
        might: 16,
        type: "lance",
        onCombatInitiate(state, target) {
            const { maxHP, hp } = target.getOne("Stats");

            if (hp / maxHP >= 0.7) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 5,
                    res: 5
                });
            }
        },
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 5,
                res: 5
            });
        },
    },
    "Yato": {
        description: "If unit initiates combat, grants Spd+4 during combat.",
        exclusiveTo: ["Corrin: Fateful Prince"],
        might: 16,
        type: "sword",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 4
            });
        },
    },
    "Wind's Brand": {
        description: "At start of turn, inflicts Atk-7 on foe on the enemy team with the highest Atk through its next action.",
        might: 14,
        exclusiveTo: ["Soren: Shrewd Strategist"],
        type: "tome",
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            const [highestAtk] = enemies.sort((hero1, hero2) => hero2.getOne("Stats").atk - hero1.getOne("Stats").atk);
            highestAtk.addComponent({
                type: "MapDebuff",
                atk: -7
            });
        },
    },
    "Wing Sword": {
        description: "Effective against armored and cavalry foes.",
        effectiveAgainst: ["armored", "cavalry"],
        might: 16,
        exclusiveTo: ["Caeda: Talys's Heart"],
        type: "sword"
    },
};

export default WEAPONS;
