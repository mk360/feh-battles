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
import getSurroundings from "../systems/get-surroundings";
import canReachTile from "../systems/can-reach-tile";
import getTileCoordinates from "../systems/get-tile-coordinates";
import getCombatStats from "../systems/get-combat-stats";
import getMapStats from "../systems/get-map-stats";
import { getUnitsLowerThanOrEqualingValue, getUnitsWithHighestValue, getUnitsWithLowestValue } from "../systems/value-matchers";
import ASSISTS from "./assists";
import { applyMapComponent } from "../systems/apply-map-effect";
import SPECIALS from "./specials";

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
        onSpecialTrigger?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatStart?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatAfter?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatRoundAttack?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onEquip?(this: Skill): any;
        onTurnAllyCheckRange?(this: Skill, state: GameState, ally: Entity): void;
        onTurnCheckRange?(this: Skill, state: GameState): void;
        onTurnStart?(this: Skill, battleState: GameState): void;
        onTurnStartBefore?(this: Skill, battleState: GameState): void;
        onTurnStartAfter?(this: Skill, battleState: GameState): void;
        onAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        onAllyAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
    }
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
                if (HeroSystem.getDistance(enemy, this.entity) <= 2) {
                    applyMapComponent(enemy, "MapDebuff", {
                        atk: -4,
                    }, this.entity);
                }
            }
        },
    },
    "Nóatún": {
        description: "If unit's HP ≤ 40%, unit can move to a space adjacent to any ally.",
        exclusiveTo: ["Anna: Commander"],
        might: 16,
        type: "axe",
        onTurnCheckRange(state) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.4) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    const { x, y } = ally.getOne("Position");
                    const tile = state.map[y][x];
                    const surroundings = getSurroundings(state.map, y, x);
                    surroundings.splice(surroundings.indexOf(tile), 1);
                    const validAllyTiles = surroundings.filter((tile) => canReachTile(this.entity, tile));
                    for (let tile of validAllyTiles) {
                        const { x: tileX, y: tileY } = getTileCoordinates(tile);
                        this.entity.addComponent({
                            type: "WarpTile",
                            x: tileX,
                            y: tileY
                        });
                    }
                }
            }
        }
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
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -3,
                    res: -3
                }, this.entity);
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
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -3,
                    res: -3
                }, this.entity);
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
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5
                }, this.entity);
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
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -7,
                    res: -7
                }, this.entity);
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
    "Absorb": {
        type: "staff",
        might: 4,
        description: "Restores HP = 50% of damage dealt.",
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        }
    },
    "Absorb+": {
        type: "staff",
        might: 7,
        description: "Restores HP = 50% of damage dealt. After combat, if unit attacked, restores 7 HP to allies within 2 spaces of unit.",
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        },
        onCombatAfter(state) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }
        }
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
        onEquip() {
            this.entity.getOne("Stats").spd -= 5;
        },
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
    "Assault": {
        type: "staff",
        description: "",
        might: 10
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
    "Audhulma": {
        description: "Accelerates Special trigger (cooldown count-1). Grants Res+5.",
        type: "sword",
        might: 16,
        exclusiveTo: ["Joshua: Tempest King"],
        onEquip() {
            this.entity.getOne("Stats").res += 5;
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Aura": {
        description: "If unit initiates combat, restores 5 HP to adjacent allies after combat.",
        type: "tome",
        exclusiveTo: ["Linde: Light Mage"],
        might: 14,
        onCombatAfter(state) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 5
                        });
                    }
                }
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
    "Ayra's Blade": {
        type: "sword",
        exclusiveTo: ["Ayra: Astra's Wielder"],
        might: 16,
        description: "Grants Spd+3. If unit's Spd > foe's Spd, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        onEquip() {
            this.entity.getOne("Stats").spd += 3;
        },
        onCombatRoundAttack(enemy) {
            const { spd: enemySpd } = getCombatStats(enemy);
            const { spd } = getCombatStats(this.entity);
            if (spd > enemySpd) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
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
    "Blazing Durandal": {
        description: "Grants Atk+3. If unit's Atk > foe's Atk, grants Special cooldown charge +1 per unit's attack. (Only highest value applied. Does not stack.)",
        exclusiveTo: ["Roy: Brave Lion"],
        type: "sword",
        might: 16,
        onEquip() {
            this.entity.getOne("Stats").atk += 3;
        },
        onCombatRoundAttack(enemy) {
            const { atk } = getCombatStats(enemy);
            const { atk: selfAtk } = getCombatStats(this.entity);
            if (selfAtk > atk) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
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
            Effects.bladeTome(this);
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
            Effects.bladeTome(this);
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
    "Blessed Bouquet": {
        type: "tome",
        color: "blue",
        description: "If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 8,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Blessed Bouquet+": {
        type: "tome",
        color: "blue",
        description: "If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 12,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Blue Egg": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "tome",
        color: "blue",
        might: 7,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Blue Egg+": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "tome",
        color: "blue",
        might: 11,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
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
    "Bow of Beauty": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        type: "bow",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 14,
        exclusiveTo: ["Leon: True of Heart"]
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
    "Brynhildr": {
        description: "If unit initiates combat, inflicts status on foe restricting movement to 1 space through its next action.",
        exclusiveTo: ["Leo: Sorcerous Prince"],
        type: "tome",
        might: 14,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                applyMapComponent(target, "GravityComponent", null, this.entity);
            }
        },
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
                type: "ApplyAffinity",
                value: 20
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
    "Candied Dagger": {
        exclusiveTo: ["Gaius: Candy Stealer"],
        might: 14,
        type: "dagger",
        description: "If unit initiates combat, grants Spd+4 and deals damage = 10% of unit's Spd during combat. Effect:【Dagger ７】",
        onCombatInitiate(state, target) {
            this.entity.addComponent({
                type: "CombatBuff",
                spd: 4
            });

            const { spd } = getCombatStats(this.entity);

            this.entity.addComponent({
                type: "DamageIncrease",
                amount: Math.floor(spd * 0.1)
            });
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    def: -7,
                    res: -7
                });
            }
        },
    },
    "Candlelight": {
        description: "After combat, if unit attacked, inflicts status on foe preventing counterattacks through its next action.",
        type: "staff",
        might: 7,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "PreventCounterattack", {}, this.entity);
            }
        },
    },
    "Candlelight+": {
        description: "After combat, if unit attacked, inflicts status on target and foes within 2 spaces of target preventing counterattacks through their next actions.",
        type: "staff",
        might: 11,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(battleState, target);
                applyMapComponent(target, "PreventCounterattack", {}, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PreventCounterattack", {}, this.entity);
                    }
                }
            }
        },
    },
    "Carrot Axe": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "axe",
        might: 9,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Carrot Axe+": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "axe",
        might: 13,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Carrot Lance": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "lance",
        might: 9,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Carrot Lance+": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "lance",
        might: 13,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
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
    "Clarisse's Bow": {
        description: "Effective against flying foes. If unit initiates combat, inflicts Atk/Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        type: "bow",
        might: 7,
        effectiveAgainst: ["flier"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "MapDebuff", {
                            atk: -5,
                            spd: -5
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Clarisse's Bow+": {
        description: "Effective against flying foes. If unit initiates combat, inflicts Atk/Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        type: "bow",
        might: 11,
        effectiveAgainst: ["flier"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "MapDebuff", {
                            atk: -5,
                            spd: -5
                        }, this.entity);
                    }
                }
            }
        },
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
    "Concealed Blade": {
        might: 16,
        type: "sword",
        description: "Deals +10 damage when Special triggers.",
        exclusiveTo: ["Athena: Borderland Sword"],
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            if (special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundAttack) {
                    this.entity.addComponent({
                        type: "RoundDamageIncrease",
                        amount: 10
                    });
                }
            }
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
    "Cupid Arrow": {
        type: "bow",
        effectiveAgainst: ["flier"],
        description: "Effective against flying foes. If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 8,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Cupid Arrow+": {
        type: "bow",
        effectiveAgainst: ["flier"],
        description: "Effective against flying foes.&lt;br>If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 12,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Cursed Lance": {
        description: "Accelerates Special trigger (cooldown count-1). Grants Atk/Spd+2. Deals 4 damage to unit after combat.",
        exclusiveTo: ["Valter: Dark Moonstone"],
        might: 16,
        type: "lance",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
            this.entity.getOne("Stats").atk += 2;
            this.entity.getOne("Stats").spd += 2;
        },
        onCombatAfter() {
            this.entity.addComponent({
                type: "MapDamage",
                value: 4
            });
        },
    },
    "Cymbeline": {
        exclusiveTo: ["Sanaki: Begnion's Apostle"],
        might: 14,
        description: "If unit initiates combat, grants Atk+4 to adjacent allies for 1 turn after combat.",
        type: "tome",
        onCombatAfter(state) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(state, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        applyMapComponent(ally, "MapBuff", {
                            atk: 4
                        }, this.entity);
                    }
                }
            }
        }
    },
    "Dark Breath": {
        description: "If unit initiates combat, inflicts Atk/Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        might: 9,
        type: "breath",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const enemies = getAllies(battleState, target);
                for (let enemy of enemies) {
                    if (HeroSystem.getDistance(enemy, target) <= 2) {
                        applyMapComponent(enemy, "MapDebuff", {
                            atk: -5,
                            spd: -5,
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Dark Breath+": {
        description: "If unit initiates combat, inflicts Atk/Spd-5 on foes within 2 spaces of target through their next actions after combat.",
        might: 13,
        type: "breath",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const enemies = getAllies(battleState, target);
                for (let enemy of enemies) {
                    if (HeroSystem.getDistance(enemy, target) <= 2) {
                        applyMapComponent(enemy, "MapDebuff", {
                            atk: -5,
                            spd: -5
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Dark Excalibur": {
        might: 14,
        type: "tome",
        description: "Deals +10 damage when Special triggers.",
        exclusiveTo: ["Sonya: Vengeful Mage"],
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            if (special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundAttack) {
                    this.entity.addComponent({
                        type: "RoundDamageIncrease",
                        amount: 10
                    });
                }
            }
        }
    },
    "Dancer's Fan": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat. After combat, if unit attacked, inflicts Def/Res-5 on foe through its next action.",
        might: 7,
        type: "dagger",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5
                }, this.entity);
            }
        },
    },
    "Dancer's Fan+": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat. After combat, if unit attacked, inflicts Def/Res-7 on foe through its next action.",
        might: 10,
        type: "dagger",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -7,
                    res: -7
                }, this.entity);
            }
        },
    },
    "Dancer's Ring": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        might: 8,
        type: "tome",
        color: "green",
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }
        },
    },
    "Dancer's Ring+": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        might: 12,
        type: "tome",
        color: "green",
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }
        },
    },
    "Dancer's Score": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        might: 8,
        type: "tome",
        color: "blue",
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }
        },
    },
    "Dancer's Score+": {
        description: "If unit initiates combat, restores 7 HP to adjacent allies after combat.",
        might: 12,
        type: "tome",
        color: "blue",
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        ally.addComponent({
                            type: "Heal",
                            value: 7
                        });
                    }
                }
            }
        },
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
                    applyMapComponent(ally, "MapBuff", {
                        atk: 6
                    }, this.entity);
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
                    type: "CombatBuff",
                    atk: 5,
                    def: 5,
                    res: 5
                });
            }
        },
    },
    "Dauntless Lance": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against armored foes.",
        effectiveAgainst: ["armored"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        type: "lance",
        exclusiveTo: ["Nephenee: Fierce Halberdier"],
        might: 16
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
    "Deathly Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-7 on foe through its next action. If unit initiates combat, deals 7 damage to foe after combat.",
        type: "dagger",
        might: 11,
        exclusiveTo: ["Jaffar: Angel of Death"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -7,
                    res: -7
                });
            }

            if (this.entity.getOne("InitiateCombat")) {
                target.addComponent({
                    type: "MapDamage",
                    value: 7
                });
            }
        },
    },
    "Deft Harpoon": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit.",
        type: "lance",
        might: 10,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP) {
                this.entity.addComponent({
                    type: "MapDamage",
                    value: 2
                });
            }
        }
    },
    "Deft Harpoon+": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit.",
        type: "lance",
        might: 14,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP && this.entity.getOne("DealDamage")) {
                this.entity.addComponent({
                    type: "MapDamage",
                    value: 2
                });
            }
        }
    },
    "Devil Axe": {
        type: "axe",
        exclusiveTo: ["Barst: The Hatchet"],
        might: 16,
        description: "Grants Atk/Spd/Def/Res+4 during combat, but if unit attacked, deals 4 damage to unit after combat.",
        onCombatStart() {
            this.entity.addComponent({
                type: "CombatBuff",
                atk: 4,
                res: 4,
                spd: 4,
                def: 4
            });
        },
        onCombatAfter() {
            if (this.entity.getOne("DealDamage")) {
                this.entity.addComponent({
                    type: "MapDamage",
                    value: 4
                });
            }
        },
    },
    "Dignified Bow": {
        description: "Effective against flying foes. At start of turn, if any foe's HP ≤ unit's HP-1 and that foe is adjacent to another foe, inflicts【Panic】on that foe.",
        might: 14,
        effectiveAgainst: ["flier"],
        exclusiveTo: ["Virion: Elite Archer"],
        type: "bow",
        onTurnStart(state) {
            const targets: Entity[] = [];
            const enemies = getEnemies(state, this.entity);
            const { hp } = this.entity.getOne("Stats");
            for (let enemy of enemies) {
                const { hp: enemyHP } = enemy.getOne("Stats");
                if (enemyHP > hp - 1 || targets.includes(enemy)) continue;
                const allies = getAllies(state, enemy).filter((ally) => HeroSystem.getDistance(ally, enemy) === 1 && !targets.includes(ally));
                targets.push(enemy);
                for (let ally of allies) {
                    targets.push(ally);
                }
            }

            for (let target of targets) {
                applyMapComponent(target, "PanicComponent", null, this.entity);
            }
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
                    type: "RoundDamageReduction",
                    percentage: 50
                });
            }
        },
        type: "sword",
        might: 16
    },
    "Draconic Poleaxe": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        might: 16,
        exclusiveTo: ["Titania: Mighty Mercenary"],
        type: "axe",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
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
    "Elena's Staff": {
        description: "Grants Res+3. Foe cannot counterattack. At start of turn, inflicts Atk/Spd-7 on nearest foes within 4 spaces through their next actions. After combat, if unit attacked, inflicts Atk/Spd-7 on target and foes within 2 spaces of target through their next actions.",
        onEquip() {
            this.entity.getOne("Stats").res += 3;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "PreventCounterattack"
            });
        },
        might: 14,
        exclusiveTo: ["Mist: Helpful Sister"],
        type: "staff",
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            const nearestIn4Spaces = getUnitsLowerThanOrEqualingValue(enemies, (unit) => HeroSystem.getDistance(this.entity, unit), 4);

            for (let nearEnemy of nearestIn4Spaces) {
                applyMapComponent(nearEnemy, "MapDebuff", {
                    atk: -7,
                    spd: -7
                }, this.entity);
            }
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    atk: -7,
                    spd: -7
                });
            }
        },
    },
    "Elise's Staff": {
        description: "Grants Spd+3. Calculates damage from staff like other weapons. After combat, if unit attacked, inflicts 【Gravity】on target and foes within 1 space of target.",
        exclusiveTo: ["Elise: Budding Flower"],
        type: "staff",
        might: 14,
        onEquip() {
            this.entity.getOne("Stats").spd += 3;
        },
        onCombatStart() {
            this.entity.addComponent({
                type: "NormalizeStaffDamage"
            });
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const enemyAllies = getAllies(battleState, target);
                applyMapComponent(target, "GravityComponent", null, this.entity);

                for (let enemy of enemyAllies) {
                    if (HeroSystem.getDistance(enemy, target) === 1) {
                        applyMapComponent(enemy, "GravityComponent", null, this.entity);
                    }
                }
            }
        },
    },
    "Emerald Axe": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "axe",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20,
            });
        }
    },
    "Emerald Axe+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "axe",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20,
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
                    applyMapComponent(ally, "MapBuff", {
                        atk: 5,
                        spd: 5,
                        def: 5,
                        res: 5
                    }, this.entity);
                }
            }

            if (affectWielder) {
                applyMapComponent(this.entity, "MapBuff", {
                    atk: 5,
                    spd: 5,
                    def: 5,
                    res: 5
                }, this.entity);
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
    "Fear": {
        description: "After combat, if unit attacked, inflicts Atk-6 on foe through its next action.",
        might: 5,
        type: "staff",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    atk: -6
                }, this.entity);
            }
        },
    },
    "Fear+": {
        description: "After combat, if unit attacked, inflicts Atk-7 on target and foes within 2 spaces of target through their next actions.",
        might: 12,
        type: "staff",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    atk: -7
                });
            }
        },
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
        onCombatAfter(battleState, target) {
            Effects.dagger(this, battleState, target, {
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
        onCombatInitiate() {
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
        onCombatInitiate() {
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
        onCombatInitiate() {
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
        onCombatInitiate() {
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
    "First Bite": {
        type: "lance",
        description: "If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 10,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
        },
    },
    "First Bite+": {
        type: "lance",
        description: "If unit initiates combat, grants Def/Res+2 to allies within 2 spaces for 1 turn after combat.",
        might: 14,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 2,
                            res: 2
                        }, this.entity);
                    }
                }
            }
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
            const highestRes = getUnitsWithHighestValue(enemies, (enemy) => enemy.getOne("Stats").res);

            for (let enemy of highestRes) {
                applyMapComponent(enemy, "MapDebuff", {
                    res: -7,
                }, this.entity);
            }
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
        exclusiveTo: ["Ogma: Loyal Blade"],
        type: "sword",
        might: 16,
        onEquip() {
            this.entity.getOne("Stats").atk += 3;
        },
        onCombatStart(state, enemy) {
            const { atk } = getCombatStats(enemy);
            const { atk: selfAtk } = getCombatStats(this.entity);
            if (selfAtk > atk) {
                this.entity.addComponent({
                    type: "AccelerateSpecial"
                });
            }
        },
    },
    "Gloom Breath": {
        might: 16,
        type: "breath",
        exclusiveTo: ["Corrin: Fateful Princess"],
        description: "At start of turn, inflicts Atk/Spd-7 on foes within 2 spaces through their next actions. After combat, if unit attacked, inflicts Atk/Spd-7 on target and foes within 2 spaces of target through their next actions. If foe's Range = 2, calculates damage using the lower of foe's Def or Res.",
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            for (let enemy of enemies) {
                if (HeroSystem.getDistance(enemy, this.entity) <= 2) {
                    applyMapComponent(enemy, "MapDebuff", {
                        atk: -7,
                        spd: -7,
                    }, this.entity);
                }
            }
        },
        onCombatStart(battleState, target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "TargetLowestDefense"
                });
            }
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    atk: -7,
                    spd: -7
                });
            }
        },
    },
    "Green Egg": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "tome",
        color: "green",
        might: 7,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Green Egg+": {
        description: "If unit initiates combat, restores 4 HP after combat.",
        type: "tome",
        color: "green",
        might: 11,
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat")) {
                this.entity.addComponent({
                    type: "Heal",
                    value: 4
                });
            }
        }
    },
    "Grimoire": {
        description: "If unit's HP ≥ 50%, unit can move to a space adjacent to an ally within 2 spaces.",
        type: "tome",
        exclusiveTo: ["Nowi: Eternal Witch"],
        might: 14,
        onTurnCheckRange(state) {
            const allies = getAllies(state, this.entity);
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                for (let ally of allies) {
                    Effects.guidance(ally, state, this.entity);
                }
            }
        },
    },
    "Golden Dagger": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "sword",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 16,
        exclusiveTo: ["Saber: Driven Mercenary"]
    },
    "Golden Naginata": {
        exclusiveTo: ["Subaki: Perfect Expert"],
        might: 16,
        type: "lance",
        description: "Accelerates Special trigger (cooldown count-1). At start of combat, if foe's Atk ≥ unit's Atk+3, grants Atk/Spd/Def/Res+3 during combat.",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        onCombatStart(battleState, target) {
            const foeAtk = getMapStats(target).atk;
            const selfAtk = getMapStats(this.entity).atk;
            if (foeAtk >= selfAtk + 3) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 3,
                    def: 3,
                    res: 3,
                    spd: 3
                });
            }
        },
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
    "Grado Poleax": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        type: "axe",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        exclusiveTo: ["Amelia: Rose of the War"]
    },
    "Gravity": {
        description: "After combat, if unit attacked, inflicts status on foe restricting movement to 1 space through its next action.",
        type: "staff",
        might: 6,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "GravityComponent", null, this.entity);
            }
        },
    },
    "Gravity+": {
        description: "After combat, if unit attacked, inflicts status on foe restricting movement to 1 space through its next action.",
        type: "staff",
        might: 10,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "GravityComponent", null, this.entity);
            }
        },
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
            Effects.bladeTome(this);
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
            Effects.bladeTome(this);
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
    "Gronnraven": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        type: "tome",
        color: "green",
        might: 7,
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
    },
    "Gronnraven+": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        type: "tome",
        color: "green",
        might: 11,
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
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
    "Hibiscus Tome": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "green",
        might: 8,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Hibiscus Tome+": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "green",
        might: 12,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
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
                if (HeroSystem.getDistance(this.entity, ally) <= 2 && ["flier", "infantry"].includes(ally.getOne("MovementType").value)) {
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
    "Inscribed Tome": {
        description: "Grants weapon-triangle advantage against colorless foes, and inflicts weapon-triangle disadvantage on colorless foes during combat.",
        type: "tome",
        exclusiveTo: ["Boey: Skillful Survivor"],
        might: 14,
        onCombatStart(state, target) {
            Effects.raven(this, target);
        }
    },
    "Inveterate Axe": {
        type: "axe",
        might: 16,
        exclusiveTo: ["Gunter: Inveterate Soldier"],
        description: "At start of turn, if unit's HP ≥ 50%, inflicts Atk/Def-5 on foe on the enemy team with the lowest Spd through its next action.",
        onTurnStartBefore(battleState) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP >= 0.5) {
                const enemies = getEnemies(battleState, this.entity);
                let targets = getUnitsWithLowestValue(enemies, (unit) => unit.getOne("Stats").spd);

                for (let target of targets) {
                    applyMapComponent(target, "MapDebuff", {
                        def: -5,
                        atk: -5
                    }, this.entity);
                }
            }
        },
    },
    "Iris's Tome": {
        type: "tome",
        color: "green",
        exclusiveTo: ["Nino: Pious Mage"],
        might: 14,
        description: "Grants bonus to unit's Atk = total bonuses on unit during combat.",
        onCombatStart() {
            Effects.bladeTome(this);
        }
    },
    "Jakob's Tray": {
        exclusiveTo: ["Jakob: Devoted Servant"],
        type: "dagger",
        might: 14,
        description: "If unit initiates combat, inflicts Atk/Spd/Def/Res-4 on foe during combat. Effect:【Dagger ７】\n【Dagger ７】\n After combat, if unit attacked, inflicts Def/Res-７ on target and foes within 2 spaces of target through their next actions.",
        onCombatInitiate(state, target) {
            target.addComponent({
                type: "CombatDebuff",
                atk: -4,
                spd: -4,
                def: -4,
                res: -4
            });
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    def: -7,
                    res: -7
                });
            }
        },
    },
    "Jubilant Blade": {
        description: "Effective against armored foes.",
        exclusiveTo: ["Tobin: The Clueless One"],
        effectiveAgainst: ["armored"],
        might: 16,
        type: "sword"
    },
    "Kagero's Dart": {
        description: "At start of combat, if unit's Atk > foe's Atk, grants Atk/Spd+4 during combat. Effect:【Dagger ７】",
        might: 14,
        type: "dagger",
        exclusiveTo: ["Kagero: Honorable Ninja"],
        onCombatStart(state, target) {
            const { atk: currentAtk } = getMapStats(this.entity);
            const { atk: opponentAtk } = getMapStats(target);

            if (currentAtk > opponentAtk) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 4,
                    spd: 4
                });
            }
        },
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    def: -7,
                    res: -7
                });
            }
        },
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
    "Killing Edge": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "sword",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 7,
    },
    "Killing Edge+": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "sword",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 11,
    },
    "Kitty Paddle": {
        description: "Effective against magic foes. After combat, if unit attacked and if foe uses magic, inflicts Def/Res-5 on foe through its next action.",
        might: 5,
        type: "dagger",
        effectiveAgainst: ["tome"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage") && target.getOne("Weapon").weaponType === "tome") {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5,
                }, this.entity);
            }
        },
    },
    "Kitty Paddle+": {
        description: "Effective against magic foes. After combat, if unit attacked and if foe uses magic, inflicts Def/Res-7 on foe through its next action.",
        might: 8,
        type: "dagger",
        effectiveAgainst: ["tome"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage") && target.getOne("Weapon").weaponType === "tome") {
                applyMapComponent(target, "MapDebuff", {
                    def: -7,
                    res: -7,
                }, this.entity);
            }
        },
    },
    "Knightly Lance": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        exclusiveTo: ["Mathilda: Legendary Knight"],
        type: "lance",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
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
    "Laslow's Blade": {
        might: 16,
        exclusiveTo: ["Laslow: Dancing Duelist"],
        type: "sword",
        description: "If a movement Assist skill (like Reposition, Shove, Pivot, etc.) is used by unit or targets unit, grants Atk/Spd/Def/Res+4 to target or targeting ally and allies within 2 spaces of unit and target or targeting ally for 1 turn after movement. (Excludes unit.)",
        onAssistAfter(battleState, ally, assistSkill) {
            const targetedEntities = new Set<Entity>().add(ally);
            if (assistSkill.type.includes("movement")) {
                const allies = getAllies(battleState, this.entity);
                for (let validAlly of allies) {
                    if (HeroSystem.getDistance(validAlly, this.entity) <= 2) {
                        targetedEntities.add(validAlly);
                        applyMapComponent(validAlly, "MapBuff", {
                            atk: 4,
                            spd: 4,
                            def: 4,
                            res: 4
                        }, this.entity);
                    }
                }

                const allyAllies = getAllies(battleState, ally).filter((al) => !targetedEntities.has(al));
                for (let validAlly of allyAllies) {
                    if (HeroSystem.getDistance(validAlly, this.entity) <= 2) {
                        targetedEntities.add(validAlly);
                        applyMapComponent(validAlly, "MapBuff", {
                            atk: 4,
                            spd: 4,
                            def: 4,
                            res: 4
                        }, ally);
                    }
                }
            }
        },
        onAllyAssistAfter(battleState, sourceAlly, assistData) {
            const targetedEntities = new Set<Entity>().add(sourceAlly);
            if (assistData.type.includes("movement")) {
                const allies = getAllies(battleState, this.entity);
                for (let validAlly of allies) {
                    if (HeroSystem.getDistance(validAlly, this.entity) <= 2) {
                        targetedEntities.add(validAlly);
                        applyMapComponent(validAlly, "MapBuff", {
                            atk: 4,
                            spd: 4,
                            def: 4,
                            res: 4
                        }, this.entity);
                    }
                }

                const allyAllies = getAllies(battleState, sourceAlly).filter((al) => !targetedEntities.has(al));
                for (let validAlly of allyAllies) {
                    if (HeroSystem.getDistance(validAlly, this.entity) <= 2) {
                        targetedEntities.add(validAlly);
                        applyMapComponent(validAlly, "MapBuff", {
                            atk: 4,
                            spd: 4,
                            def: 4,
                            res: 4
                        }, sourceAlly);
                    }
                }
            }
        },
    },
    "Legion's Axe": {
        type: "axe",
        might: 10,
        description: "After combat, if unit attacked, converts bonuses on foe into penalties through its next action.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "PanicComponent", {}, this.entity);
            }
        },
    },
    "Legion's Axe+": {
        type: "axe",
        might: 14,
        description: "After combat, if unit attacked, converts bonuses on foe into penalties through its next action.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "PanicComponent", {}, this.entity);
            }
        },
    },
    "Light Breath": {
        description: "If unit initiates combat, grants Def/Res+4 to adjacent allies for 1 turn after combat.",
        type: "breath",
        might: 9,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 4,
                            res: 4
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Light Breath+": {
        description: "If unit initiates combat, grants Def/Res+4 to adjacent allies for 1 turn after combat.",
        type: "breath",
        might: 13,
        onCombatAfter(battleState) {
            if (this.entity.getOne("InitiateCombat")) {
                const allies = getAllies(battleState, this.entity);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) === 1) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 4,
                            res: 4
                        }, this.entity);
                    }
                }
            }
        },
    },
    "Lightning Breath": {
        description: "Slows Special trigger (cooldown count+1). Unit can counterattack regardless of foe's range.",
        might: 7,
        type: "breath",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatDefense() {
            this.entity.addComponent({
                type: "Counterattack"
            })
        },
    },
    "Lightning Breath+": {
        description: "Slows Special trigger (cooldown count+1). Unit can counterattack regardless of foe's range.",
        might: 11,
        type: "breath",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatDefense() {
            this.entity.addComponent({
                type: "Counterattack"
            })
        },
    },
    "Lilith Floatie": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "axe",
        might: 10,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Lilith Floatie+": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "axe",
        might: 14,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Lordly Lance": {
        description: "Effective against armored foes.",
        effectiveAgainst: ["armored"],
        might: 16,
        type: "lance",
        exclusiveTo: ["Clive: Idealistic Knight"]
    },
    "Loyal Greatlance": {
        type: "lance",
        exclusiveTo: ["Oscar: Agile Horseman"],
        might: 16,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Melon Crusher": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit.",
        type: "axe",
        might: 10,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP) {
                this.entity.addComponent({
                    type: "MapDamage",
                    value: 2
                });
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5
                }, this.entity);
            }
        }
    },
    "Melon Crusher+": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit.",
        type: "axe",
        might: 14,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP) {
                this.entity.addComponent({
                    type: "MapDamage",
                    value: 2
                });
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5
                }, this.entity);
            }
        }
    },
    "Monstrous Bow": {
        type: "bow",
        effectiveAgainst: ["flier"],
        might: 8,
        description: "Effective against flying foes. After combat, if unit attacked, converts bonuses on foes within 2 spaces of target into penalties through their next actions.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PanicComponent", {}, this.entity);
                    }
                }
            }
        },
    },
    "Monstrous Bow+": {
        type: "bow",
        effectiveAgainst: ["flier"],
        might: 12,
        description: "Effective against flying foes. After combat, if unit attacked, converts bonuses on foes within 2 spaces of target into penalties through their next actions.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PanicComponent", {}, this.entity);
                    }
                }
            }
        },
    },
    "Mulagir": {
        description: "Effective against flying foes. Grants Spd+3. Neutralizes magic foe's bonuses (from skills like Fortify, Rally, etc.) during combat.",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.getOne("Stats").spd += 3;
        },
        onCombatStart() {
            this.entity.addComponent({
                type: "NeutralizeMapBuffs"
            });
        },
        might: 14,
        exclusiveTo: ["Lyn: Brave Lady"],
        type: "bow"
    },
    "Mystletainn": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "sword",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 16,
        exclusiveTo: ["Eldigan: Lionheart"]
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
        },
        exclusiveTo: ["Innes: Regal Strategician"]
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
            const { def, res } = getCombatStats(target);
            if (def >= res + 5) {
                this.entity.addComponent({
                    type: "DamageIncrease",
                    amount: 7
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
            Effects.bladeTome(this);
        }
    },
    "Pain": {
        description: "After combat, if unit attacked, deals 10 damage to foe.",
        type: "staff",
        might: 3,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                target.addComponent({
                    type: "AoEDamage",
                    value: 10
                });
            }
        },
    },
    "Pain+": {
        description: "Deals 10 damage to target and foes within 2 spaces of target after combat.",
        type: "staff",
        might: 10,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                target.addComponent({
                    type: "AoEDamage",
                    value: 10
                });
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        ally.addComponent({
                            type: "AoEDamage",
                            value: 10
                        });
                    }
                }
            }
        },
    },
    "Panic": {
        type: "staff",
        might: 7,
        description: "After combat, if unit attacked, converts bonuses on foe into penalties through its next action.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "PanicComponent", {}, this.entity);
            }
        },
    },
    "Panic+": {
        type: "staff",
        might: 11,
        description: "After combat, if unit attacked, converts bonuses on target and foes within 2 spaces of target into penalties through their next actions.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "PanicComponent", {}, this.entity);
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PanicComponent", {}, this.entity);
                    }
                }
            }
        },
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
                type: "ApplyAffinity",
                value: 20
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
    "Poison Dagger": {
        description: "Effective against infantry foes.&lt;br>After combat, if unit attacked, inflicts Def/Res-4 on infantry foe through its next action.",
        might: 2,
        type: "dagger",
        effectiveAgainst: ["infantry"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage") && target.getOne("MovementType").value === "infantry") {
                Effects.dagger(this, battleState, target, {
                    def: -4,
                    res: -4
                });
            }
        },
    },
    "Poison Dagger+": {
        description: "Effective against infantry foes.&lt;br>After combat, if unit attacked, inflicts Def/Res-4 on infantry foe through its next action.",
        might: 5,
        type: "dagger",
        effectiveAgainst: ["infantry"],
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage") && target.getOne("MovementType").value === "infantry") {
                Effects.dagger(this, battleState, target, {
                    def: -4,
                    res: -4
                });
            }
        },
    },
    "Purifying Breath": {
        exclusiveTo: ["Nowi: Eternal Youth"],
        might: 14,
        description: "Slows Special trigger (cooldown count+1). Unit can counterattack regardless of foe's range. If foe's Range = 2, calculates damage using the lower of foe's Def or Res.",
        type: "breath",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: 1
            });
        },
        onCombatStart(state, target) {
            this.entity.addComponent({
                type: "Counterattack"
            });
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "TargetLowestDefense"
                });
            }
        }
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
            Effects.bladeTome(this);
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
            Effects.bladeTome(this);
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
    "Rebecca's Bow": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        type: "bow",
        effectiveAgainst: ["flier"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 14,
        exclusiveTo: ["Rebecca: Wildflower"]
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
    "Resolute Blade": {
        exclusiveTo: ["Mia: Lady of Blades"],
        might: 16,
        type: "sword",
        description: "Grants Atk+3. Deals +10 damage when Special triggers.",
        onEquip() {
            this.entity.getOne("Stats").atk += 3;
        },
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            if (special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundAttack) {
                    this.entity.addComponent({
                        type: "RoundDamageIncrease",
                        amount: 10
                    });
                }
            }
        }
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
    "Rogue Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-3 on foe through its next action. Grants unit Def/Res+3 for 1 turn.",
        might: 4,
        type: "dagger",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -3,
                    res: -3,
                }, this.entity);

                applyMapComponent(this.entity, "MapBuff", {
                    def: 3,
                    res: 3,
                }, this.entity);
            }
        },
    },
    "Rogue Dagger+": {
        description: "After combat, if unit attacked, inflicts Def/Res-5 on foe through its next action. Grants unit Def/Res+5 for 1 turn.",
        might: 7,
        type: "dagger",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5,
                }, this.entity);

                applyMapComponent(this.entity, "MapBuff", {
                    def: 5,
                    res: 5,
                }, this.entity);
            }
        },
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
    "Runeaxe": {
        description: "When unit deals damage to foe during combat, restores 7 HP to unit. (Triggers even if 0 damage is dealt.)",
        might: 16,
        exclusiveTo: ["Narcian: Wyvern General"],
        type: "axe",
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                amount: 7
            });
        }
    },
    "Saizo's Star": {
        type: "dagger",
        exclusiveTo: ["Saizo: Angry Ninja"],
        description: "After combat, if unit attacked, inflicts Atk/Spd/Def/Res-6 on target and foes within 2 spaces of target through their next actions.",
        might: 14,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    atk: -6,
                    spd: -6,
                    def: -6,
                    res: -6
                });
            }
        },
    },
    "Sapphire Lance": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 8,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
    },
    "Sapphire Lance+": {
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        type: "lance",
        might: 12,
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
    },
    "Scarlet Sword": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 16,
        type: "sword",
        exclusiveTo: ["Navarre: Scarlet Sword"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Sealife Tome": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "blue",
        might: 8,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Sealife Tome+": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "blue",
        might: 12,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Seashell": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit. After combat, if unit attacked, inflicts Def/Res-5 on foe through its next action.",
        type: "dagger",
        might: 7,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP) {
                this.entity.addComponent({
                    type: "AoEDamage",
                    value: 2
                });
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -5,
                    res: -5
                }, this.entity);
            }
        }
    },
    "Seashell+": {
        description: "At start of combat, if unit's HP = 100%, grants Atk/Spd/Def/Res+2, but after combat, if unit attacked, deals 2 damage to unit. After combat, if unit attacked, inflicts Def/Res-7 on foe through its next action.",
        type: "dagger",
        might: 10,
        onCombatStart() {
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (hp === maxHP) {
                this.entity.addComponent({
                    type: "CombatBuff",
                    atk: 2,
                    spd: 2,
                    def: 2,
                    res: 2
                });
            }
        },
        onCombatAfter(state, target) {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const { value: startingHP } = this.entity.getOne("StartingHP");
            if (hp === startingHP && hp === maxHP) {
                this.entity.addComponent({
                    type: "AoEDamage",
                    value: 2
                });
            }

            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    def: -7,
                    res: -7
                }, this.entity);
            }
        }
    },
    "Selena's Blade": {
        type: "sword",
        description: "Effective against armored foes. At start of combat, if foe's Atk ≥ unit's Atk+3, grants Atk/Spd/Def/Res+3 during combat.",
        might: 16,
        effectiveAgainst: ["armored"],
        exclusiveTo: ["Selena: Cutting Wit"],
        onCombatStart(state, target) {
            const { atk: unitAtk } = getMapStats(this.entity)
            const { atk: enemyAtk } = getMapStats(target);
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
    "Silverbrand": {
        type: "sword",
        exclusiveTo: ["Seth: Silver Knight"],
        might: 16,
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
            });
        }
    },
    "Slaying Axe": {
        type: "axe",
        might: 10,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Slaying Axe+": {
        type: "axe",
        might: 14,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Slaying Bow": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        might: 8,
        effectiveAgainst: ["flier"],
        type: "bow",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
    },
    "Slaying Bow+": {
        description: "Accelerates Special trigger (cooldown count-1). Effective against flying foes.",
        might: 12,
        effectiveAgainst: ["flier"],
        type: "bow",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
    },
    "Slaying Lance": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 10,
        type: "lance",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
    },
    "Slaying Lance+": {
        description: "Accelerates Special trigger (cooldown count-1).",
        might: 14,
        type: "lance",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        }
    },
    "Slaying Edge": {
        type: "sword",
        might: 10,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Slaying Edge+": {
        type: "sword",
        might: 14,
        description: "Accelerates Special trigger (cooldown count-1).",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
    },
    "Slow": {
        description: "After combat, if unit attacked, inflicts Spd-6 on foe through its next action.",
        type: "staff",
        might: 5,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                applyMapComponent(target, "MapDebuff", {
                    spd: -6
                }, this.entity);
            }
        },
    },
    "Slow+": {
        description: "After combat, if unit attacked, inflicts Spd-7 on target and foes within 2 spaces of target through their next actions.",
        type: "staff",
        might: 12,
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    spd: -7
                });
            }
        },
    },
    "Smoke Dagger": {
        description: "After combat, if unit attacked, inflicts Def/Res-4 on foes within 2 spaces of target through their next actions.",
        type: "dagger",
        might: 6,
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, state, target, {
                    def: -4,
                    res: -4
                });
            }
        }
    },
    "Smoke Dagger+": {
        description: "After combat, if unit attacked, inflicts Def/Res-6 on foes within 2 spaces of target through their next actions.",
        type: "dagger",
        might: 9,
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, state, target, {
                    def: -6,
                    res: -6
                });
            }
        }
    },
    "Sniper's Bow": {
        description: "Effective against flying foes. After combat, if unit attacked, deals 7 damage to target and foes within 2 spaces of target, and inflicts Atk/Spd-7 on them through their next actions.",
        might: 14,
        exclusiveTo: ["Clarisse: Sniper in the Dark"],
        effectiveAgainst: ["flier"],
        type: "bow",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, battleState, target, {
                    atk: -7,
                    spd: -7
                });
            }
        },
    },
    "Solitary Blade": {
        description: "Accelerates Special trigger (cooldown count-1).",
        type: "sword",
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        might: 16,
        exclusiveTo: ["Lon'qu: Solitary Blade"]
    },
    "Spectral Tome": {
        type: "tome",
        color: "green",
        might: 8,
        description: "After combat, if unit attacked, converts bonuses on foes within 2 spaces of target into penalties through their next actions.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PanicComponent", {}, this.entity);
                    }
                }
            }
        },
    },
    "Spectral Tome+": {
        type: "tome",
        color: "green",
        might: 12,
        description: "After combat, if unit attacked, converts bonuses on foes within 2 spaces of target into penalties through their next actions.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const allies = getAllies(battleState, target);
                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, target) <= 2) {
                        applyMapComponent(ally, "PanicComponent", {}, this.entity);
                    }
                }
            }
        },
    },
    "Springtime Staff": {
        exclusiveTo: ["Genny: Endearing Ally"],
        onEquip() {
            this.entity.getOne("Stats").atk += 3;
        },
        onCombatInitiate() {
            this.entity.addComponent({
                type: "PreventCounterattack"
            })
        },
        type: "staff",
        might: 14,
        description: "Grants Atk+3. Foe cannot counterattack. After combat, if unit attacked, inflicts 【Gravity】on target and foes within 1 space of target.",
        onCombatAfter(battleState, target) {
            if (this.entity.getOne("DealDamage")) {
                const enemies = getAllies(battleState, target).filter((enemy) => HeroSystem.getDistance(enemy, target) === 1);
                applyMapComponent(target, "GravityComponent", null, this.entity);

                for (let enemy of enemies) {
                    applyMapComponent(enemy, "GravityComponent", null, this.entity);
                }
            }
        },
    },
    "Spy's Dagger": {
        exclusiveTo: ["Matthew: Faithful Spy"],
        might: 14,
        type: "dagger",
        description: "After combat, if unit attacked, grants Def/Res+6 to unit and allies within 2 spaces of unit for 1 turn. Effect:【Dagger ６】",
        onCombatAfter(state, target) {
            if (this.entity.getOne("DealDamage")) {
                Effects.dagger(this, state, target, {
                    def: -7,
                    res: -7
                });

                const allies = getAllies(state, this.entity);
                applyMapComponent(this.entity, "MapBuff", {
                    def: 6,
                    res: 6
                }, this.entity);

                for (let ally of allies) {
                    if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                        applyMapComponent(ally, "MapBuff", {
                            def: 6,
                            res: 6
                        }, this.entity);
                    }
                }
            }
        }
    },
    "Sol Katti": {
        description: "If unit's HP ≤ 50% and unit initiates combat, unit can make a follow-up attack before foe can counterattack.",
        onCombatInitiate() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            if (hp / maxHP <= 0.5) {
                this.entity.addComponent({
                    type: "Desperation"
                });
            }
        },
        exclusiveTo: ["Lyn: Lady of the Plains"],
        might: 16,
        type: "sword"
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
            Effects.bladeTome(this);
        }
    },
    "Tomato Tome": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "red",
        might: 8,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Tomato Tome+": {
        description: "Grants Atk/Spd+1 to allies within 2 spaces during combat.",
        type: "tome",
        color: "red",
        might: 12,
        onCombatAllyStart(state, ally) {
            if (HeroSystem.getDistance(ally, this.entity) <= 2) {
                ally.addComponent({
                    type: "CombatBuff",
                    atk: 1,
                    spd: 1
                });
            }
        },
    },
    "Tome of Thoron": {
        description: "At start of turn, if unit's HP ≤ 75% and unit's attack can trigger their Special, grants Special cooldown count-1, and deals +10 damage when Special triggers.",
        exclusiveTo: ["Tailtiu: Thunder Noble"],
        type: "tome",
        might: 14,
        onTurnStart() {
            const special = this.entity.getOne("Special");

            if (special) {
                const specialData = SPECIALS[special.name];
                const { hp, maxHP } = this.entity.getOne("Stats");
                if (specialData.onCombatRoundAttack && hp / maxHP <= 0.75) {
                    this.entity.addComponent({
                        type: "AccelerateSpecial"
                    });
                }
            }
        },
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            const specialData = SPECIALS[special.name];
            const { hp, maxHP } = this.entity.getOne("Stats");

            if (specialData.onCombatRoundAttack && hp / maxHP <= 0.75) {
                this.entity.addComponent({
                    type: "RoundDamageIncrease",
                    amount: 10
                });
            }
        },
        onCombatStart() {
            const special = this.entity.getOne("Special");

            if (special) {
                const specialData = SPECIALS[special.name];
                const { hp, maxHP } = this.entity.getOne("Stats");
                if (specialData.onCombatRoundAttack && hp / maxHP <= 0.75) {
                    this.entity.addComponent({
                        type: "AccelerateSpecial"
                    });
                }
            }
        },
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
    "Urðr": {
        description: "If Sing or Dance is used, grants Atk/Spd/Def/Res+3 to target.",
        type: "axe",
        might: 16,
        exclusiveTo: ["Azura: Lady of Ballads"],
        onAssistAfter(battleState, ally, skill) {
            const assistDex = ASSISTS[skill.name];
            if (assistDex.type.includes("refresh")) {
                applyMapComponent(ally, "MapBuff", {
                    atk: 3,
                    spd: 3,
                    def: 3,
                    res: 3
                }, this.entity);
            }
        },
    },
    "Urvan": {
        description: "Accelerates Special trigger (cooldown count-1). If unit receives consecutive attacks, reduces damage from foe's second attack onward by 80%.",
        type: "axe",
        might: 16,
        exclusiveTo: ["Ike: Brave Mercenary"],
        onEquip() {
            this.entity.addComponent({
                type: "ModifySpecialCooldown",
                value: -1
            });
        },
        onCombatRoundDefense(enemy, combatRound) {
            if (combatRound.consecutiveTurnNumber > 1) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.8,
                });
            }
        },
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
                    applyMapComponent(enemy, "MapDebuff", {
                        atk: -4,
                        res: -4
                    }, this.entity);
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
    "Weirding Tome": {
        type: "tome",
        might: 14,
        exclusiveTo: ["Lute: Prodigy"],
        description: "Grants Spd+3. At start of turn, inflicts Spd-5 on foes in cardinal directions with Res < unit's Res through their next actions.",
        onEquip() {
            this.entity.getOne("Stats").spd += 3;
        },
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            const selfPosition = this.entity.getOne("Position");
            const selfStats = this.entity.getOne("Stats");
            for (let enemy of enemies) {
                const { x, y } = enemy.getOne("Position");
                const { res } = enemy.getOne("Stats");
                if ((selfPosition.x === x || selfPosition.y === y) && selfStats.res > res) {

                    applyMapComponent(enemy, "MapDebuff", {
                        spd: -5,
                    }, this.entity);
                }
            }
        },
    },
    "Whitewing Blade": {
        might: 16,
        type: "sword",
        description: "If unit has weapon-triangle advantage, boosts Atk by 20%. If unit has weapon-triangle disadvantage, reduces Atk by 20%.",
        onCombatStart() {
            this.entity.addComponent({
                type: "ApplyAffinity",
                value: 20
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
    "Wind's Brand": {
        description: "At start of turn, inflicts Atk-7 on foe on the enemy team with the highest Atk through its next action.",
        might: 14,
        exclusiveTo: ["Soren: Shrewd Strategist"],
        type: "tome",
        onTurnStart(battleState) {
            const enemies = getEnemies(battleState, this.entity);
            const highestAtk = getUnitsWithHighestValue(enemies, (entity) => entity.getOne("Stats").atk);

            for (let hero of highestAtk) {
                applyMapComponent(hero, "MapDebuff", {
                    atk: -7,
                }, this.entity);
            }
        },
    },
    "Wing Sword": {
        description: "Effective against armored and cavalry foes.",
        effectiveAgainst: ["armored", "cavalry"],
        might: 16,
        exclusiveTo: ["Caeda: Talys's Heart"],
        type: "sword"
    },
    "Wo Dao": {
        might: 9,
        type: "sword",
        description: "Deals +10 damage when Special triggers.",
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            if (special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundAttack) {
                    this.entity.addComponent({
                        type: "RoundDamageIncrease",
                        amount: 10
                    });
                }
            }
        }
    },
    "Wo Dao+": {
        might: 13,
        type: "sword",
        description: "Deals +10 damage when Special triggers.",
        onSpecialTrigger() {
            const special = this.entity.getOne("Special");
            if (special) {
                const specialData = SPECIALS[special.name];
                if (specialData.onCombatRoundAttack) {
                    this.entity.addComponent({
                        type: "RoundDamageIncrease",
                        amount: 10
                    });
                }
            }
        }
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
