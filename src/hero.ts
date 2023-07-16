import Weapon from "./weapon";
import { WeaponColor, WeaponType } from "./weapon";
import { Stats, StatsBuffsTable, StatusBuff, HeroSkills, StatusDebuff, MovementType, MandatoryStats, MapCoordinates, Stat } from "./types";
import { CursorsReference, createCursorsReference } from "./cursor";
import shortid from "shortid";
import Special from "./special";
import PassiveSkill from "./passive_skill";
import Assist from "./assist";
import BaseSkill, { SkillSlot } from "./base_skill";

interface Hero {
    name: string;
    id: string;
    baseStats: Stats;
    stats: Stats;
    maxHP: number
    battleMods: StatsBuffsTable;
    mapBoosts: StatsBuffsTable;
    mapPenalties: StatsBuffsTable;
    positiveStatuses: StatusBuff[];
    negativeStatuses: StatusDebuff[];
    color: WeaponColor,
    skills: HeroSkills;
    movementType: MovementType,
    bane?: keyof MandatoryStats;
    boon?: keyof MandatoryStats;
    coordinates: MapCoordinates,
    allowedWeaponTypes?: WeaponType | WeaponType[]
    allies?: Hero[]
    enemies?: Hero[],
    cursors: CursorsReference
    statuses: Array<StatusDebuff | StatusBuff>
};

interface HeroConstructor {
    name: string,
    growthRates: MandatoryStats,
    boon?: keyof MandatoryStats,
    bane?: keyof MandatoryStats,
    lv1Stats: MandatoryStats,
    weaponType: WeaponType,
    movementType: MovementType,
    weaponColor: WeaponColor
};

function convertToLv40(baseStat: number, growthRate: number) {
    const appliedGrowthRate = Math.trunc(growthRate * 1.14);
    const growthValue = Math.trunc(appliedGrowthRate * 0.39);
    return baseStat + growthValue;
}

class Hero {
    constructor(heroConstructor?: HeroConstructor) {
        if (heroConstructor) {
            this.name = heroConstructor.name;
            this.allowedWeaponTypes = heroConstructor.weaponType;
            if (heroConstructor.bane && heroConstructor.boon) {
                if (heroConstructor.bane === heroConstructor.boon) {
                    throw new Error("Bane cannot be the same as boon");
                }

                this.bane = heroConstructor.bane;
                this.boon = heroConstructor.boon;
            }
        }
        this.enemies = [];
        this.id = shortid.generate();
        this.allies = [];
        this.statuses = [];
        this.skills = {};
        this.movementType = heroConstructor.movementType,
        this.cursors = createCursorsReference();
        this.battleMods = {
            atk: 0,
            def: 0,
            spd: 0,
            res: 0
        };
        this.mapBoosts = {
            atk: 0,
            def: 0,
            spd: 0,
            res: 0
        };

        this.mapPenalties = {
            atk: 0,
            def: 0,
            spd: 0,
            res: 0
        };

        this.setLv1Stats({
            stats: heroConstructor.lv1Stats,
            boon: this.boon,
            bane: this.bane,
            growthRates: heroConstructor.growthRates
        });
    };
    getDistance(hero: Hero) {
        return Math.abs(hero.coordinates.x - this.coordinates.x) + Math.abs(hero.coordinates.y - this.coordinates.y);
    };
    setAllowedWeaponType(type: WeaponType | WeaponType[]) {
        this.allowedWeaponTypes = type;
    };
    setAlly(hero: Hero) {
        this.allies.push(hero);
        return this;
    };
    getWeapon() {
        if (this.skills.weapon) return this.skills.weapon;
        return null;
    };
    lowerCursor(label: keyof CursorsReference, value: number) {
        this.cursors[label].decreaseValue(value);
    };
    raiseCursor(label: keyof CursorsReference, value: number) {
        this.cursors[label].increaseValue(value);
    };
    setEnemy(hero: Hero) {
        this.enemies.push(hero);
        return this;
    };
    getMovementType() {
        return this.movementType;
    };
    setName(name: string) {
        this.name = name;
        return this;
    };
    setMapBoosts(mods: Stats) {
        for (let stat in mods) {
            if ((mods[stat] > 0 && this.getCursorValue("mapBuff") >= 0)) {
                this.mapBoosts[stat] = mods[stat] < 0 ? Math.min(this.mapBoosts[stat], mods[stat]) :  Math.max(mods[stat], this.mapBoosts[stat]);
            }
        }
        return this;
    };

    setMapPenalties(mods: Stats) {
        this.mapPenalties = mods;
        return this;
    };
    raiseStat(stat: Stat, value: number) {
        this.stats[stat] += value;
        if (stat === "hp") this.maxHP += value;
        return this;
    };
    lowerStat(stat: Stat, value: number) {
        this.stats[stat] -= value;
        if (stat === "hp") this.maxHP -= value;
        return this;
    };
    setBattleMods(mods: StatsBuffsTable) {
        for (let stat in mods) {
            if (mods[stat] < 0 || (mods[stat] > 0 && this.getCursorValue("combatBuff") >= 0)) {
                this.battleMods[stat] += mods[stat];
            }
        }
        return this;
    };
    equipSkill(skill: BaseSkill) {
        if (!this.skills) this.skills = {};
        if (skill instanceof Weapon) {
            this.skills.weapon = skill;
        }

        if (skill instanceof Assist) {
            this.skills.assist = skill;
        }

        if (skill instanceof Special) {
            this.skills.special = skill;
        }

        if (skill instanceof PassiveSkill) {
            this.skills[skill.slot as "A" | "B" | "C" | "S"] = skill;
        }
        
        if (skill.onEquip) {
            skill.onEquip(this);
        }
        return this;
    };
    setCoordinates({ x, y }: MapCoordinates) {
        this.coordinates = { x, y };
        return this;
    };
    addStatus(status: StatusBuff | StatusDebuff) {
        this.statuses.push(status);
        return this;
    };
    getStatuses() {
        return this.statuses;
    };
    setMovementType(type: MovementType) {
        this.movementType = type;
        return this;
    };
    addBuffIndicator(buffIndicator: StatusBuff) {
        this.addStatus(buffIndicator);
        return this;
    };
    addDebuffIndicator(debuffIndicator: StatusDebuff) {
        this.addStatus(debuffIndicator);
        return this;
    };
    getCursorValue(label: keyof CursorsReference) {
        return this.cursors[label].getCurrentValue();
    };
    setColor(color: WeaponColor) {
        this.color = color;
        return this;
    };
    setWeapon(weapon: Weapon) {
        this.stats = { ...this.baseStats };
        if (this.allowedWeaponTypes) {
            if (this.allowedWeaponTypes === weapon.type || this.allowedWeaponTypes.includes(weapon.type)) {
                this.equipSkill(weapon);
                this.setColor(weapon.color);
                if (this.stats) {
                    this.applyWeaponBuff();
                }
            } else {
                throw new Error(`Incompatible weapon ${weapon.name} with hero ${this.name}`);
            }
        } else {
            this.equipSkill(weapon);
            this.setColor(weapon.color);
            if (this.stats) {
                this.applyWeaponBuff();
            }
        }
        return this;
    };
    getBattleStats() {
        let initialStats = this.stats;
        initialStats = modifyStatValues(initialStats, this.mapPenalties);
        if (this.cursors.mapBuff.getCurrentValue() >= 0) {
            initialStats = modifyStatValues(initialStats, this.mapBoosts);
        }
        if (this.cursors.combatBuff.getCurrentValue() >= 0) {
            initialStats = modifyStatValues(initialStats, this.battleMods);
        }
        return initialStats;
    };
    getMapStats() {
        return modifyStatValues(this.stats, this.mapBoosts, this.mapPenalties);
    }
    setLv1Stats({
        stats, growthRates,
        boon, bane
    }: {
        stats: MandatoryStats,
        growthRates: MandatoryStats,
        boon?: keyof MandatoryStats,
        bane?: keyof MandatoryStats
    }) {
        if (bane && boon) {
            if (bane === boon) {
                throw new Error("Bane cannot be the same as boon");
            }

            this.bane = bane;
            this.boon = boon;
            stats[bane]--;
            stats[boon]++;

            growthRates[bane] -= 5;
            growthRates[boon] += 5;
        }

        const lv40Stats = stats;
        for (let stat in lv40Stats) {
            const castStat = stat as keyof MandatoryStats;
            lv40Stats[castStat] = convertToLv40(stats[stat], growthRates[stat]);
        }

        this.setBaseStats(lv40Stats);
    }
    private setBaseStats(stats: Stats) {
        this.stats = stats;
        this.baseStats = stats;
        this.maxHP = this.stats.hp;
        return this;
    };
    applyWeaponBuff() {
        this.stats.atk += this.skills.weapon.might;
    };
};

function modifyStatValues(baseStats: Stats, ...modifiers: Stats[]) {
    let copy = { ...baseStats };
    for (let modifier of modifiers) {
        for (let changedStat in modifier) {
            let value = modifier[changedStat];
            copy[changedStat] += value;
            copy[changedStat] = Math.max(copy[changedStat], 0);
        }
    }
    return copy;
};

export default Hero;
