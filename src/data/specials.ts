import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../interfaces/types";
import Characters from "./characters.json";
import getCombatStats from "../systems/get-combat-stats";
import getTargetedDefenseStat from "../systems/get-targeted-defense-stat";
import GameState from "../systems/state";
import getSurroundings from "../systems/get-surroundings";
import getMapStats from "../systems/get-map-stats";
import ASSISTS from "./assists";
import { balm } from "./effects";
import getAllies from "../utils/get-allies";
import HeroSystem from "../systems/hero";
import Direction from "../systems/directions";
import CombatTurnOutcome from "../interfaces/combat-turn-outcome";

const exceptStaves: WeaponType[] = ["axe", "beast", "bow", "breath", "dagger", "lance", "sword", "tome"];

const melee: WeaponType[] = ["axe", "beast", "breath", "sword", "lance"];

interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        type?: "aoe";
        getAoETargets?(state: GameState, target: Entity): Set<Entity>;
        getAoEDamage?(skill: Skill, state: GameState, target: Entity): number;
        onAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        onSpecialTrigger?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatStart?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatAfter?(this: Skill, battleState: GameState, target: Entity): void;
        onCombatInitiate?(this: Skill, state: GameState, target: Entity): void;
        onCombatAllyStart?(this: Skill, state: GameState, ally: Entity): void;
        onCombatDefense?(this: Skill, state: GameState, attacker: Entity): void;
        onCombatRoundAttack?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onCombatRoundDefense?(this: Skill, enemy: Entity, combatRound: Partial<CombatTurnOutcome>): void;
        onEquip?(this: Skill): any;
        onTurnCheckRange?(this: Skill, state: GameState): void;
        onTurnStart?(this: Skill, battleState: GameState): void;
        onTurnStartBefore?(this: Skill, battleState: GameState): void;
        onTurnStartAfter?(this: Skill, battleState: GameState): void;
        onAllyAssistAfter?(this: Skill, battleState: GameState, ally: Entity, assistSkill: Skill): void;
        shouldActivate?(this: Skill, damage: number): boolean;
    }
}

function calculateAoEDamage(multiplier: 1 | 1.5) {
    return function (skill: Skill, state: GameState, target: Entity) {
        const { atk } = getMapStats(skill.entity);
        const defenderMapStats = getMapStats(target);
        const targetedDefense = getTargetedDefenseStat(skill.entity, target, defenderMapStats);
        const { [targetedDefense]: defense } = defenderMapStats;

        if (atk < defense) return 0;

        return Math.floor(atk * multiplier) - defense;
    };
}

const SPECIALS: SpecialsDict = {
    "Aegis": {
        description: "If foe is 2 spaces from unit, reduces damage from foe's attack by 50%.",
        allowedWeaponTypes: melee,
        cooldown: 3,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.5
                });
            }
        }
    },
    "Aether": {
        description: "Treats foe's Def/Res as if reduced by 50% during combat. Restores HP = half of damage dealt.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 5,
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defenseStat = getTargetedDefenseStat(this.entity, target, combatStats);
            const stat = combatStats[defenseStat];
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(stat * 0.5)
            });

            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        },
    },
    "Astra": {
        description: "Boosts damage dealt by 150%.",
        cooldown: 4,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                percentage: 150
            })
        }
    },
    "Bonfire": {
        description: "Boosts damage by 50% of unit's Def.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 3,
        onCombatRoundAttack() {
            const { def } = getCombatStats(this.entity);

            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.5)
            });
        }
    },
    "Black Luna": {
        description: "Treats foe's Def/Res as if reduced by 80% during combat. (Skill cannot be inherited.)",
        exclusiveTo: ["Black Knight: Sinister General"],
        onCombatRoundAttack(target) {
            const combatStats = getCombatStats(target);
            const defStat = getTargetedDefenseStat(this.entity, target, combatStats);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(combatStats[defStat] * 0.8)
            });
        },
        allowedWeaponTypes: exceptStaves,
        cooldown: 3
    },
    "Blazing Flame": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1.5),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnSameRow = HeroSystem.getDistance(ally, target) <= 2 && targetPosition.y === allyPos.y;

                if (isOnSameRow) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Blazing Thunder": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1.5),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnSameColumn = HeroSystem.getDistance(ally, target) <= 2 && targetPosition.x === allyPos.x;

                if (isOnSameColumn) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Blazing Light": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1.5),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnDiagonal = HeroSystem.getDistance(ally, target) === 2 && targetPosition.x !== allyPos.x && targetPosition.y !== allyPos.y;

                if (isOnDiagonal) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Blazing Wind": {
        type: "aoe",
        cooldown: 4,
        allowedWeaponTypes: exceptStaves,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to 1.5 x (unit's Atk minus foe's Def or Res).",
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const { x, y } = target.getOne("Position");
            const tiles = getSurroundings(state.map, y, x, new Set<Uint16Array>(state.map[y][x]));
            for (let tile of tiles) {
                const occupier = state.occupiedTilesMap.get(tile);
                if (occupier && occupier.getOne("Side").value !== this.entity.getOne("Side").value) {
                    targets.add(occupier);
                }
            }

            return targets;
        },
        getAoEDamage: calculateAoEDamage(1.5),
    },
    "Buckler": {
        description: "Reduces damage from an adjacent foe's attack by 30%.",
        allowedWeaponTypes: melee,
        cooldown: 3,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 1) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.3
                });
            }
        }
    },
    "Chilling Wind": {
        description: "Boosts damage by 50% of unit's Res.",
        cooldown: 4,
        onCombatRoundAttack() {
            const { res } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(res * 0.5)
            })
        },
        allowedWeaponTypes: exceptStaves
    },
    "Daylight": {
        description: "Restores HP = 30% of damage dealt.",
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 30
            });
        },
        cooldown: 3,
        allowedWeaponTypes: exceptStaves
    },
    "Draconic Aura": {
        description: "Boosts damage by 30% of unit's Atk.",
        cooldown: 3,
        onCombatRoundAttack() {
            const { atk } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(atk * 0.3)
            })
        },
        allowedWeaponTypes: exceptStaves
    },
    "Dragon Fang": {
        description: "Boosts damage by 50% of unit's Atk.",
        cooldown: 4,
        onCombatRoundAttack() {
            const { atk } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(atk / 2)
            });
        },
        allowedWeaponTypes: exceptStaves
    },
    "Escutcheon": {
        description: "Reduces damage from an adjacent foe's attack by 30%.",
        allowedWeaponTypes: melee,
        cooldown: 2,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 1) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.3
                });
            }
        }
    },
    "Galeforce": {
        description: "If unit initiates combat, grants unit another action after combat. (Once per turn.)",
        cooldown: 5,
        onTurnStart() {
            const galeforced = this.entity.getOne("Galeforce");
            if (galeforced) {
                this.entity.removeComponent(galeforced);
            }
        },
        onCombatAfter() {
            if (this.entity.getOne("InitiateCombat") && !this.entity.getOne("Galeforce")) {
                this.entity.addComponent({
                    type: "Galeforce"
                });
            }
        },
        allowedWeaponTypes: melee,
    },
    "Glacies": {
        description: "Boosts damage by 80% of unit's Res.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 4,
        onCombatRoundAttack() {
            const { res } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(res * 0.8)
            });
        }
    },
    "Glimmer": {
        description: "Boosts damage dealt by 50%.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 2,
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                percentage: 50
            });
        }
    },
    "Glowing Ember": {
        description: "Boosts damage by 50% of unit's Def.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 4,
        onCombatRoundAttack() {
            const { def } = getCombatStats(this.entity);

            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.5)
            });
        }
    },
    "Growing Flame": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnSameRow = HeroSystem.getDistance(ally, target) <= 2 && targetPosition.y === allyPos.y;

                const isOnDiagonal = HeroSystem.getDistance(ally, target) === 2 && targetPosition.x !== allyPos.x && targetPosition.y !== allyPos.y;

                if (isOnSameRow || isOnDiagonal) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Growing Light": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const allies = getAllies(state, target);
            for (let ally of allies) {
                if (HeroSystem.getDistance(ally, target) === 2) {
                    targets.add(ally);
                }
            }
            return targets;
        },
    },
    "Growing Thunder": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const isAdjacent = HeroSystem.getDistance(ally, target) === 1;
                const isOnSameColumn = ally.getOne("Position").y === targetPosition.y && HeroSystem.getDistance(ally, target) <= 3;

                if (isAdjacent || isOnSameColumn) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Growing Wind": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const isAdjacent = HeroSystem.getDistance(ally, target) === 1;
                if (isAdjacent) {
                    targets.add(ally);
                }
            }

            const directionVector = new Direction(targetPosition.x, targetPosition.y);

            const topLeft = directionVector.subtract(1, 1);
            const topRight = directionVector.subtract(0, 1).add(1, 0);
            const bottomLeft = directionVector.add(0, 1).subtract(1, 0);
            const bottomRight = directionVector.add(1, 1);

            const diagonalTiles = [topLeft, topRight, bottomLeft, bottomRight].map((dir) => {
                return state.map[dir.y]?.[dir.x] as Uint16Array ?? null;
            }).filter((validTile) => validTile);

            const onDiagonals = diagonalTiles.map((tile) => {
                return state.occupiedTilesMap.get(tile);
            }).filter((tile) => {
                return tile && tile.getOne("Side").value === target.getOne("Side").value;
            });

            for (let enemy of onDiagonals) {
                targets.add(enemy);
            }

            return targets;
        },
    },
    "Heavenly Light": {
        description: "When healing an ally with a staff, restores 10 HP to all allies.",
        cooldown: 2,
        allowedWeaponTypes: ["staff"],
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("healing")) {
                const remainingAllies = getAllies(battleState, this.entity).filter((i) => i !== ally);
                for (let ally of remainingAllies) {
                    ally.addComponent({
                        type: "Heal",
                        value: 10
                    });
                }
            }
        },
    },
    "Holy Vestments": {
        description: "If foe is 2 spaces from unit, reduces damage from foe's attack by 30%.",
        allowedWeaponTypes: melee,
        cooldown: 3,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.3
                });
            }
        }
    },
    "Iceberg": {
        description: "Boosts damage by 50% of unit's Res.",
        cooldown: 3,
        onCombatRoundAttack() {
            const { res } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(res / 2)
            });
        },
        allowedWeaponTypes: exceptStaves
    },
    "Ignis": {
        description: "Boosts damage by 80% of unit's Def.",
        allowedWeaponTypes: exceptStaves,
        cooldown: 4,
        onCombatRoundAttack() {
            const { def } = getCombatStats(this.entity);

            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.8)
            });
        }
    },
    "Imbue": {
        description: "When healing an ally with a staff, restores an additional 10 HP to target ally.",
        allowedWeaponTypes: ["staff"],
        onAssistAfter(battleState, ally, assistSkill) {
            const assist = ASSISTS[assistSkill.name];
            if (assist.type.includes("healing")) {
                ally.addComponent({
                    type: "Heal",
                    value: 10
                });
            }
        },
        cooldown: 1
    },
    "Luna": {
        description: "Treats foe's Def/Res as if reduced by 50% during combat.",
        cooldown: 3,
        onCombatRoundAttack(target) {
            const defStat = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [defStat]: def } = getCombatStats(target);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.5)
            });
        },
        allowedWeaponTypes: exceptStaves
    },
    "Kindled-Fire Balm": {
        description: "When healing an ally with a staff, grants Atk+4 to all allies for 1 turn.",
        allowedWeaponTypes: ["staff"],
        cooldown: 1,
        onAssistAfter(state, ally, skill) {
            const assist = ASSISTS[skill.name];
            if (assist.type.includes("healing")) {
                balm(this, state, {
                    atk: 4
                });
            }
        }
    },
    "Miracle": {
        allowedWeaponTypes: exceptStaves.concat("staff"),
        description: "If unit's HP > 1 and foe would reduce unit's HP to 0, unit survives with 1 HP.",
        shouldActivate(damage) {
            const { hp } = this.entity.getOne("Stats");
            let shouldSurvive = true;
            const survivals = this.entity.getComponents("ForcedSurvival");
            survivals.forEach((survival) => {
                if (!shouldSurvive) return;
                if (survival.source === "Miracle") {
                    shouldSurvive = false;
                }
            });
            return hp - damage <= 0 && shouldSurvive;
        },
        onCombatRoundDefense(target, round) {
            if (this.entity.getOne("ForcedSurvival")) return;
            const { hp } = this.entity.getOne("Stats");
            if (hp > 1) {
                this.entity.addComponent({
                    type: "ForceSurvival",
                    source: "Miracle"
                });
                this.entity.addComponent({
                    type: "ForcedSurvival",
                    source: "Miracle"
                });
            }
        },
        cooldown: 5,
    },
    "Moonbow": {
        description: "Treats foe's Def/Res as if reduced by 30% during combat.",
        cooldown: 2,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack(target) {
            const defStat = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [defStat]: def } = getCombatStats(target);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.3)
            });
        }
    },
    "New Moon": {
        description: "Treats foe's Def/Res as if reduced by 30% during combat.",
        cooldown: 3,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack(target) {
            const defStat = getTargetedDefenseStat(this.entity, target, getCombatStats(target));
            const { [defStat]: def } = getCombatStats(target);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(def * 0.3)
            });
        }
    },
    "Night Sky": {
        description: "Boosts damage dealt by 50%.",
        cooldown: 3,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                percentage: 50
            });
        }
    },
    "Noontime": {
        description: "Restores HP = 30% of damage dealt.",
        cooldown: 2,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 30
            });
        }
    },
    "Pavise": {
        description: "Reduces damage from an adjacent foe's attack by 50%.",
        allowedWeaponTypes: melee,
        cooldown: 3,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 1) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.5
                });
            }
        }
    },
    "Rising Flame": {
        type: "aoe",
        cooldown: 4,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnSameRow = HeroSystem.getDistance(ally, target) <= 2 && targetPosition.y === allyPos.y;

                if (isOnSameRow) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Rising Wind": {
        type: "aoe",
        cooldown: 4,
        allowedWeaponTypes: exceptStaves,
        description: "Before combat this unit initiates, foes in an area near target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const { x, y } = target.getOne("Position");
            const tiles = getSurroundings(state.map, y, x, new Set<Uint16Array>(state.map[y][x]));
            for (let tile of tiles) {
                const occupier = state.occupiedTilesMap.get(tile);
                if (occupier && occupier.getOne("Side").value !== this.entity.getOne("Side").value) {
                    targets.add(occupier);
                }
            }

            return targets;
        },
        getAoEDamage: calculateAoEDamage(1),
    },
    "Regnal Astra": {
        description: "Boosts damage by 40% of unit's Spd. (Skill cannot be inherited.)",
        cooldown: 2,
        onCombatRoundAttack() {
            const { spd } = getCombatStats(this.entity);
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(spd * 0.4)
            });
        },
        allowedWeaponTypes: exceptStaves,
        exclusiveTo: ["Ayra: Astra's Wielder"]
    },
    "Retribution": {
        description: "Boosts damage by 30% of damage dealt to unit.",
        cooldown: 3,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const diff = maxHP - hp;
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(diff * 0.3)
            });
        }
    },
    "Reprisal": {
        description: "Boosts damage by 30% of damage dealt to unit.",
        cooldown: 2,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const diff = maxHP - hp;
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(diff * 0.3)
            });
        }
    },
    "Rising Thunder": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const isOnSameColumn = ally.getOne("Position").y === targetPosition.y && HeroSystem.getDistance(ally, target) <= 2;

                if (isOnSameColumn) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Rising Light": {
        type: "aoe",
        cooldown: 5,
        description: "Before combat this unit initiates, foes in a wide area around target take damage equal to (unit's Atk minus foe's Def or Res).",
        getAoEDamage: calculateAoEDamage(1),
        allowedWeaponTypes: exceptStaves,
        getAoETargets(state, target) {
            const targets = new Set<Entity>().add(target);
            const targetPosition = target.getOne("Position");
            const allies = getAllies(state, target);
            for (let ally of allies) {
                const allyPos = ally.getOne("Position");
                const isOnDiagonal = HeroSystem.getDistance(ally, target) === 2 && targetPosition.x !== allyPos.x && targetPosition.y !== allyPos.y;

                if (isOnDiagonal) {
                    targets.add(ally);
                }
            }

            return targets;
        },
    },
    "Sacred Cowl": {
        description: "If foe is 2 spaces from unit, reduces damage from foe's attack by 30%.",
        allowedWeaponTypes: melee,
        cooldown: 3,
        onCombatRoundDefense(target) {
            if (target.getOne("Weapon").range === 2) {
                this.entity.addComponent({
                    type: "DamageReduction",
                    percentage: 0.3
                });
            }
        }
    },
    "Sol": {
        description: "Restores HP = 50% of damage dealt.",
        onCombatRoundAttack() {
            this.entity.addComponent({
                type: "CombatHeal",
                percentage: 50
            });
        },
        cooldown: 3,
        allowedWeaponTypes: exceptStaves
    },
    "Solid-Earth Balm": {
        description: "When healing an ally with a staff, grants Def+4 to all allies for 1 turn.",
        allowedWeaponTypes: ["staff"],
        cooldown: 1,
        onAssistAfter(state, ally, skill) {
            const assist = ASSISTS[skill.name];
            if (assist.type.includes("healing")) {
                balm(this, state, {
                    def: 4
                });
            }
        }
    },
    "Still-Water Balm": {
        description: "When healing an ally with a staff, grants Res+4 to all allies for 1 turn.",
        allowedWeaponTypes: ["staff"],
        cooldown: 1,
        onAssistAfter(state, ally, skill) {
            const assist = ASSISTS[skill.name];
            if (assist.type.includes("healing")) {
                balm(this, state, {
                    res: 4
                });
            }
        }
    },
    "Swift-Winds Balm": {
        description: "When healing an ally with a staff, grants Spd+4 to all allies for 1 turn.",
        allowedWeaponTypes: ["staff"],
        cooldown: 1,
        onAssistAfter(state, ally, skill) {
            const assist = ASSISTS[skill.name];
            if (assist.type.includes("healing")) {
                balm(this, state, {
                    spd: 4
                });
            }
        }
    },
    "Vengeance": {
        description: "Boosts damage by 50% of damage dealt to unit.",
        cooldown: 2,
        allowedWeaponTypes: exceptStaves,
        onCombatRoundAttack() {
            const { hp, maxHP } = this.entity.getOne("Stats");
            const diff = maxHP - hp;
            this.entity.addComponent({
                type: "RoundDamageIncrease",
                value: Math.floor(diff * 0.5)
            });
        }
    },
};

export default SPECIALS;
