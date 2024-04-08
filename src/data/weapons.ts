import Hero from "../entities/hero";
import GameState from "../systems/state";
import { MovementType, WeaponColor, WeaponType } from "../interfaces/types";
import * as Effects from "./effects";
import Skill from "../components/skill";
import Characters from "./characters.json";
import { Entity } from "ape-ecs";
import getEnemies from "../utils/get-enemies";
import HeroSystem from "../systems/hero";
import getAllies from "../utils/get-allies";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";
import CombatOutcome from "../interfaces/combat-outcome";

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
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
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
    "Amiti": {
        description: "Inflicts Spd-2. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 2;
        },
        exclusiveTo: ["Elincia: Lost Princess"],
        might: 11,
        type: "sword",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
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
    "Arthur's Axe": {
        description: "If a bonus granted by a skill like Rally or Hone is active on unit, grants Atk/Spd/Def/Res+3 during combat.",
        exclusiveTo: ["Arthur: Hapless Hero"],
        type: "axe",
        might: 16,
        onCombatStart() {
            if (this.entity.getOne("MapBuff")) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 3,
                    spd: 3,
                    def: 3,
                    res: 3
                });
            }
        }
    },
    "Assassin's Bow": {
        type: "bow",
        effectiveAgainst: ["flier"],
        might: 7,
        description: "Effective against flying foes. In combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack.",
        onCombatStart(state, target) {
            const enemyWeapon = target.getOne("Weapon");
            if (enemyWeapon.color === "colorless") {
                Effects.breaker(this, target, "dagger", 0);
            }
        }
    },
    "Assassin's Bow+": {
        type: "bow",
        effectiveAgainst: ["flier"],
        might: 11,
        description: "Effective against flying foes. In combat against a colorless dagger foe, unit makes a guaranteed follow-up attack and foe cannot make a follow-up attack.",
        onCombatStart(state, target) {
            const enemyWeapon = target.getOne("Weapon");
            if (enemyWeapon.color === "colorless") {
                Effects.breaker(this, target, "dagger", 0);
            }
        }
    },
    "Axe of Virility": {
        description: "Effective against armored foes.",
        might: 16,
        type: "axe",
        effectiveAgainst: ["armored"],
        exclusiveTo: ["Bartre: Fearless Warrior"]
    },
    "Basilikos": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        exclusiveTo: ["Raven: Peerless Fighter"],
        type: "axe",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
    },
    "Berkut's Lance": {
        description: "If foe initiates combat, grants Res+4 during combat.",
        might: 10,
        type: "lance",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 4
            });
        }
    },
    "Berkut's Lance+": {
        description: "If foe initiates combat, grants Res+4 during combat.",
        might: 14,
        type: "lance",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                res: 4
            });
        }
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
    "Blárowl": {
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "tome",
        color: "blue",
        might: 10,
        onCombatStart(state) {
            Effects.owl(this, state);
        }
    },
    "Blárowl+": {
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "tome",
        color: "blue",
        might: 14,
        onCombatStart(state) {
            Effects.owl(this, state);
        }
    },
    "Blárraven": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        might: 7,
        type: "tome",
        color: "blue",
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
    },
    "Blárraven+": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        might: 11,
        type: "tome",
        color: "blue",
        onCombatStart(state, target) {
            Effects.raven(this, target);
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
    "Book of Orchids": {
        description: "If unit initiates combat, grants Atk+6 during combat.",
        exclusiveTo: ["Mae: Bundle of Energy"],
        might: 16,
        type: "tome",
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 6
            });
        }
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
    "Bull Spear": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        exclusiveTo: ["Sully: Crimson Knight"],
        type: "lance",
        might: 16,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        }
    },
    "Camilla's Axe": {
        description: "If unit is within 2 spaces of a cavalry or flying ally, grants Atk/Spd+4 during combat.",
        might: 16,
        type: "axe",
        exclusiveTo: ["Camilla: Bewitching Beauty"],
        onCombatStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (["cavalry", "flier"].includes(ally.getOne("MovementType").value) && HeroSystem.getDistance(this.entity, ally) <= 2) {
                    this.entity.addComponent({
                        type: "CombatBuff",
                        atk: 4,
                        spd: 4,
                    });
                    return;
                }
            }
        },
    },
    "Cherche's Axe": {
        type: "axe",
        might: 11,
        exclusiveTo: ["Cherche: Wyvern Friend"],
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Cordelia's Lance": {
        type: "lance",
        might: 10,
        exclusiveTo: ["Cordelia: Knight Paragon"],
        description: "Inflicts Spd-2. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 2;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Corvus Tome": {
        type: "tome",
        color: "red",
        might: 14,
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        onCombatStart(battleState, target) {
            Effects.raven(this, target);
        },
        exclusiveTo: ["Henry: Twisted Mind"]
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
    "Dark Aura": {
        description: "At start of turn, if adjacent allies use sword, axe, lance, dragonstone, or beast damage, grants Atk+6 to those allies for 1 turn.",
        type: "tome",
        color: "blue",
        might: 14,
        exclusiveTo: ["Delthea: Free Spirit"],
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(this.entity, ally) === 1 && ["sword", "lance", "axe", "breath", "beast"].includes(ally.getOne("Weapon").weaponType)) {
                    ally.addComponent({
                        type: "MapBuff",
                        atk: 6
                    });
                }
            }
        },
    },
    "Dark Royal Spear": {
        exclusiveTo: ["Berkut: Prideful Prince"],
        might: 16,
        type: "lance",
        description: "If foe initiates combat or if foe's HP = 100% at start of combat, grants Atk/Def/Res+5 to unit during combat.",
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 5,
                def: 5,
                res: 5
            });
        },
        onCombatInitiate(state, target) {
            const { maxHP, hp } = target.getOne("Stats");
            if (hp === maxHP) {
                this.entity.addComponent({
                    atk: 5,
                    def: 5,
                    res: 5
                });
            }
        },
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
    "Dire Thunder": {
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        type: "tome",
        exclusiveTo: ["Reinhardt: Thunder's Fist"],
        might: 9,
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Divine Naga": {
        exclusiveTo: ["Deirdre: Lady of the Forest"],
        might: 14,
        type: "tome",
        color: "green",
        description: "Effective against dragon foes. Neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during combat.",
        effectiveAgainst: ["breath"],
        onCombatStart() {
            this.entity.addComponent({
                type: "NeutralizeMapBuffs"
            });
        },
    },
    "Divine Tyrfing": {
        description: "Grants Res+3. Reduces damage from magic foe's first attack by 50%.",
        exclusiveTo: ["Sigurd: Holy Knight"],
        onEquip() {
            this.entity.getOne("Stats").res += 3;
        },
        onCombatRoundDefense(enemy, combatRound) {
            if (combatRound.turnNumber === 1 && enemy.getOne("Weapon").weaponType === "tome") {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.5
                });
            }
        },
        type: "sword",
        might: 16
    },
    "Durandal": {
        might: 16,
        type: "sword",
        description: "If unit initiates combat, grants Atk+4 during combat.",
        exclusiveTo: ["Eliwood: Knight of Lycia"],
        onCombatInitiate() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4
            });
        }
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
    "Emerald Axe": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "axe",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        }
    },
    "Emerald Axe+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "axe",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        }
    },
    "Eternal Breath": {
        type: "breath",
        might: 16,
        exclusiveTo: ["Fae: Divine Dragon"],
        description: "At start of turn, if an ally is within 2 spaces of unit, grants Atk/Spd/Def/Res+5 to unit and allies within 2 spaces for 1 turn. If foe's Range = 2, calculates damage using the lower of foe's Def or Res.",
        onTurnStart(battleState) {
            const allies = getAllies(battleState, this.entity);
            let affectWielder = false;

            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                    affectWielder = true;
                    ally.addComponent({
                        type: "MapBuff",
                        atk: 5,
                        spd: 5,
                        def: 5,
                        res: 5,
                    });
                }
            }

            if (affectWielder) {
                this.entity.addComponent({
                    type: "MapBuff",
                    atk: 5,
                    spd: 5,
                    def: 5,
                    res: 5,
                });
            }
        },
        onCombatStart(state, target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "TargetLowestDefense"
                });
            }
        }
    },
    "Eternal Tome": {
        might: 14,
        type: "tome",
        color: "red",
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        onCombatStart(state, enemy) {
            Effects.raven(this, enemy);
        },
        exclusiveTo: ["Sophia: Nabata Prophet"]
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
    "Firesweep Lance": {
        description: "Unit and foe cannot counterattack.",
        might: 11,
        type: "lance",
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
    "Firesweep Lance+": {
        description: "Unit and foe cannot counterattack.",
        might: 15,
        type: "lance",
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
    "Fujin Yumi": {
        effectiveAgainst: ["flier"],
        description: "Effective against flying foes. If unit's HP ≥ 50%, unit can move through foes' spaces.",
        might: 14,
        type: "bow",
        exclusiveTo: ["Takumi: Wild Card"],
        onTurnStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "Pass"
                });
            }
        }
    },
    "Geirskögul": {
        description: "Grants Def+3. If allies within 2 spaces use sword, lance, axe, bow, dagger, or beast damage, grants Atk/Spd+3 to those allies during combat.",
        exclusiveTo: ["Lucina: Brave Princess"],
        might: 16,
        type: "lance",
        onEquip() {
            this.entity.getOne("Stats").def += 3;
        },
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(this.entity, ally) <= 2 && ["sword", "lance", "axe", "dagger", "bow", "beast"].includes(ally.getOne("Weapon").weaponType)) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 3,
                    spd: 3
                });
            }
        },
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
    "Gronnowl": {
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "tome",
        color: "green",
        might: 6,
        onCombatStart(battleState) {
            Effects.owl(this, battleState);
        },
    },
    "Gronnowl+": {
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "tome",
        color: "green",
        might: 10,
        onCombatStart(battleState) {
            Effects.owl(this, battleState);
        },
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
    "Guardian's Axe": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        exclusiveTo: ["Hawkeye: Desert Guardian"],
        type: "axe",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
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
    "Hermit's Tome": {
        description: "Effective against cavalry foes. If foe uses bow, dagger, magic, or staff, neutralizes foe's bonuses (from skills like Fortify, Rally, etc.) during combat.",
        exclusiveTo: ["Raigh: Dark Child"],
        might: 14,
        type: "tome",
        effectiveAgainst: ["cavalry"],
        onCombatStart(battleState, target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "NeutralizeMapBuffs"
                });
            }
        },
    },
    "Hewn Lance": {
        type: "lance",
        might: 11,
        exclusiveTo: ["Donnel: Village Hero"],
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Hinata's Katana": {
        description: "If foe initiates combat, grants Atk/Def+4 during combat.",
        might: 16,
        type: "sword",
        exclusiveTo: ["Hinata: Wild Samurai"],
        onCombatDefense() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                def: 4
            });
        }
    },
    "Hinoka's Spear": {
        description: "If unit is within 2 spaces of a flying or infantry ally, grants Atk/Spd+4 during combat.",
        exclusiveTo: ["Hinoka: Warrior Princess"],
        type: "lance",
        might: 16,
        onCombatStart(state) {
            const allies = getAllies(state, this.entity);
            for (let ally of allies) {
                if (HeroSystem.getDistance(this.entity, ally) <= 2) {
                    this.entity.addComponent({
                        type: "CombatBuff",
                        atk: 4,
                        spd: 4
                    });
                    return;
                }
            }
        }
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
    "Jakob's Tray": {
        exclusiveTo: ["Jakob: Devoted Servant"],
        type: "dagger",
        might: 16,
        description: "If unit initiates combat, inflicts Atk/Spd/Def/Res-4 on foe during combat.&lt;br>Effect:\u3010Dagger \uff17\u3011&lt;br>&lt;br>\u3010Dagger \uff17\u3011&lt;br>After combat, if unit attacked, inflicts Def/Res-\uff17 on target and foes within 2 spaces of target through their next actions.",
        onCombatInitiate(state, target) {
            this.entity.addComponent({
                type: "CombatDebuff",
                atk: 4,
                spd: 4,
                def: 4,
                res: 4
            });
        },
        onCombatAfter(battleState, target, combat) {

        },
    },
    "Jubilant Blade": {
        description: "Effective against armored foes.",
        exclusiveTo: ["Tobin: The Clueless One"],
        effectiveAgainst: ["armored"],
        might: 16,
        type: "sword"
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
    "Killer Bow": {
        type: "bow",
        might: 5,
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Killer Bow+": {
        type: "bow",
        might: 9,
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Killer Lance": {
        type: "lance",
        might: 7,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Killer Lance+": {
        type: "lance",
        might: 11,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Laid-Back Blade": {
        exclusiveTo: ["Gray: Wry Comrade"],
        might: 16,
        type: "sword",
        effectiveAgainst: ["cavalry"],
        description: "Effective against cavalry foes. At start of combat, if unit's HP ≥ 50%, grants Atk/Spd/Def/Res+3 during combat.",
        onCombatStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 3,
                    spd: 3,
                    def: 3,
                    res: 3
                });
            }
        }
    },
    "Lordly Lance": {
        description: "Effective against armored foes.",
        effectiveAgainst: ["armored"],
        might: 16,
        type: "lance",
        exclusiveTo: ["Clive: Idealistic Knight"]
    },
    "Mulagir": {
        description: "Effective against flying foes. Grants Spd+3. Neutralizes magic foe's bonuses (from skills like Fortify, Rally, etc.) during combat.",
        effectiveAgainst: ["flier"],
        onCombatStart() {
            this.entity.addComponent({
                type: "NeutralizeMapBuffs"
            });
        },
        might: 14,
        exclusiveTo: ["Lyn: Brave Lady"],
        type: "bow"
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
    "Nidhogg": {
        description: "Effective against flying foes. During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "bow",
        might: 14,
        effectiveAgainst: ["flier"],
        onCombatStart(state) {
            Effects.owl(this, state);
        }
    },
    "Niles's Bow": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes. If foe's Def ≥ foe's Res+5, deals +7 damage.",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        effectiveAgainst: ["flier"],
        onCombatStart(state, target) {
            const { def, res } = target.getOne("Stats");
            if (def >= res + 5) {
                this.entity.addComponent({
                    type: "DamageIncrease",
                    value: 7
                });
            }
        },
        exclusiveTo: ["Niles: Cruel to Be Kind"],
        type: "bow",
        might: 14
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
    "Panther Sword": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        exclusiveTo: ["Stahl: Viridian Knight"],
        type: "sword",
        might: 16,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
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
    "Ragnarok": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd+5, but after combat, if unit attacked, deals 5 damage to unit.",
        type: "tome",
        might: 14,
        onCombatStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 5,
                    spd: 5
                });
            }
        },
        onCombatAfter() {

        },
        exclusiveTo: ["Celica: Caring Princess"]
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
    "Rauðrblade": {
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
        color: "red",
        might: 9
    },
    "Rauðrblade+": {
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
        color: "red",
        might: 13
    },
    "Rauðrowl": {
        might: 6,
        type: "tome",
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        color: "red",
        onCombatStart(battleState) {
            Effects.owl(this, battleState);
        },
    },
    "Rauðrowl+": {
        might: 10,
        type: "tome",
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        color: "red",
        onCombatStart(battleState) {
            Effects.owl(this, battleState);
        },
    },
    "Rauðrraven": {
        type: "tome",
        color: "red",
        might: 7,
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        onCombatStart(battleState, target) {
            Effects.raven(this, target);
        },
    },
    "Rauðrraven+": {
        type: "tome",
        color: "red",
        might: 11,
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        onCombatStart(battleState, target) {
            Effects.raven(this, target);
        },
    },
    "Rauðrwolf": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 6,
        type: "tome",
        color: "red"
    },
    "Rauðrwolf+": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 10,
        type: "tome",
        color: "red"
    },
    "Reese's Tome": {
        description: "During combat, boosts unit's Atk/Spd/Def/Res by number of adjacent allies × 2.",
        type: "tome",
        might: 14,
        exclusiveTo: ["Katarina: Wayward One"],
        onCombatStart(battleState) {
            Effects.owl(this, battleState);
        },
    },
    "Regal Blade": {
        description: "At start of combat, if foe's HP = 100%, grants Atk/Spd+2 during combat.",
        exclusiveTo: ["Lloyd: White Wolf"],
        type: "sword",
        might: 16,
        onCombatStart(battleState, target) {
            const { maxHP, hp } = target.getOne("Stats");
            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2
                });
            }
        },
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
    "Ridersbane": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 10,
        type: "lance"
    },
    "Ridersbane+": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 14,
        type: "lance"
    },
    "Rowdy Sword": {
        might: 11,
        type: "sword",
        description: "Inflicts Spd-5. If unit initiates combat, unit attacks twice.",
        exclusiveTo: ["Luke: Rowdy Squire"],
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "BraveWeapon"
            });
        }
    },
    "Ruby Sword": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "sword",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
    },
    "Ruby Sword+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "sword",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
    },
    "Sapphire Lance": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        }
    },
    "Sapphire Lance+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        }
    },
    "Selena's Blade": {
        type: "sword",
        description: "Effective against armored foes. At start of combat, if foe's Atk ≥ unit's Atk+3, grants Atk/Spd/Def/Res+3 during combat.",
        might: 16,
        effectiveAgainst: ["armored"],
        exclusiveTo: ["Selena: Cutting Wit"],
        onCombatStart(state, target) {
            const { atk: unitAtk } = this.entity.getOne("Stats");
            const { atk: enemyAtk } = target.getOne("Stats");
            if (enemyAtk >= unitAtk + 3) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 3,
                    spd: 3,
                    def: 3,
                    res: 3
                });
            }
        }
    },
    "Setsuna's Yumi": {
        exclusiveTo: ["Setsuna: Absent Archer"],
        type: "bow",
        might: 14,
        description: "Effective against flying foes. If foe uses bow, dagger, magic, or staff, grants Atk/Spd/Def/Res+4 during combat.",
        effectiveAgainst: ["flier"],
        onCombatStart() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                spd: 4,
                def: 4,
                res: 4
            });
        }
    },
    "Shanna's Lance": {
        type: "lance",
        exclusiveTo: ["Shanna: Sprightly Flier"],
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
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
    "Steady Lance": {
        description: "Unit and foe cannot counterattack.",
        might: 16,
        type: "lance",
        exclusiveTo: ["Roderick: Steady Squire"],
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
    "Stout Tomahawk": {
        might: 16,
        description: "Unit can counterattack regardless of enemy range.",
        type: "sword",
        exclusiveTo: ["Dorcas: Serene Warrior"],
        onCombatStart() {
            Effects.counterattack(this);
        }
    },
    "Tactical Bolt": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        exclusiveTo: ["Robin: High Deliverer"],
        type: "tome",
        color: "blue",
        might: 14,
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
    },
    "Tactical Gale": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        exclusiveTo: ["Robin: Mystery Tactician"],
        type: "tome",
        color: "green",
        might: 14,
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
    },
    "Tharja's Hex": {
        description: "Grants bonus to unit's Atk = total bonuses on unit during combat.",
        might: 14,
        exclusiveTo: ["Tharja: Dark Shadow"],
        type: "tome",
        color: "red",
        onCombatStart() {
            Effects.blade(this);
        }
    },
    "Tyrfing": {
        description: "If unit's HP ≤ 50%, grants Def+4 during combat.",
        type: "sword",
        might: 16,
        exclusiveTo: ["Seliph: Heir of Light"],
        onCombatStart() {
            const { maxHP, hp } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 4
                });
            }
        }
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
    "Vidofnir": {
        description: "If foe initiates combat and uses sword, lance, or axe, grants Def+7 during combat.",
        onCombatDefense(state, attacker) {
            if (["sword", "lance", "axe"].includes(attacker.getOne("Weapon").weaponType)) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    def: 7
                });
            }
        },
        type: "lance",
        might: 16,
        exclusiveTo: ["Tana: Winged Princess"]
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
    "Whitewing Blade": {
        might: 16,
        type: "sword",
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity"
            });
        },
        exclusiveTo: ["Palla: Eldest Whitewing"]
    },
    "Whitewing Lance": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        exclusiveTo: ["Catria: Middle Whitewing"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        type: "lance"
    },
    "Whitewing Spear": {
        description: "Effective against armored and cavalry foes.",
        type: "lance",
        might: 16,
        effectiveAgainst: ["armored"],
        exclusiveTo: ["Est: Junior Whitewing"],
    },
    "Zanbato": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 10,
        type: "sword",
    },
    "Zanbato+": {
        description: "Effective against cavalry foes.",
        effectiveAgainst: ["cavalry"],
        might: 14,
        type: "sword",
    },
};

export default WEAPONS;
