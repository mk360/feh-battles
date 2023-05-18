import Weapon from "./weapon";
import Skill from "./passive_skill";
import { WeaponColor, WeaponType } from "./weapon";
import { Stats, StatsBuffsTable, heroBuffs, HeroSkills, heroDebuffs, MovementType, MandatoryStats, MapCoordinates, StatEnum } from "./types";
import { CursorsReference, createCursorsReference } from "./cursor";
import shortid from "shortid";

interface Hero {
    name: string;
    id: string;
    baseStats: Stats;
    stats: Stats;
    maxHP: number
    battleMods: StatsBuffsTable
    mapMods: StatsBuffsTable
    positiveStatuses: heroBuffs[];
    negativeStatuses: heroDebuffs[];
    color: WeaponColor,
    skills: HeroSkills,
    movementType: MovementType,
    coordinates: MapCoordinates,
    allowedWeaponTypes?: WeaponType | WeaponType[]
    allies?: Hero[]
    enemies?: Hero[],
    cursors: CursorsReference
    statuses: Array<heroDebuffs | heroBuffs>
};

interface HeroConstructor {
    name: string,
    stats: MandatoryStats,
    weaponType?: WeaponType,
    movementType: MovementType,
    weaponColor?: WeaponColor
};

class Hero {
    constructor(heroConstructor?: HeroConstructor) {
        if (heroConstructor) {
            if (heroConstructor.name) this.name = heroConstructor.name;
            if (heroConstructor.stats) {
                this.setBaseStats(heroConstructor.stats);
            }
            if (heroConstructor.weaponType) {
                this.allowedWeaponTypes = heroConstructor.weaponType;
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
        this.mapMods = {
            atk: 0,
            def: 0,
            spd: 0,
            res: 0
        };
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
    setMapMods(mods: Stats) {
        for (let stat in mods) {
            if (mods[stat] < 0 || (mods[stat] > 0 && this.getCursorValue("mapBuff") >= 0)) {
                this.mapMods[stat] = mods[stat] < 0 ? Math.min(this.mapMods[stat], mods[stat]) :  Math.max(mods[stat], this.mapMods[stat]);
            }
        }
        return this;
    };
    raiseStat(stat: StatEnum, value: number) {
        this.stats[stat] += value;
        if (stat === "hp") this.maxHP += value;
        return this;
    };
    lowerStat(stat: StatEnum, value: number) {
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
    equipSkill(skill: Skill | Weapon) {
        if (!this.skills) this.skills = {};
        this.skills[skill.slot] = skill;
        if (skill.onEquip) {
            skill.onEquip(this);
        }
        return this;
    };
    setCoordinates({ x, y }: MapCoordinates) {
        this.coordinates = { x, y };
        return this;
    };
    addStatus(status: heroBuffs | heroDebuffs) {
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
    addBuffIndicator(buffIndicator: heroBuffs) {
        this.addStatus(buffIndicator);
        return this;
    };
    addDebuffIndicator(debuffIndicator: heroDebuffs) {
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
        if (this.cursors.mapBuff.getCurrentValue() >= 0) {
            initialStats = modifyStatValues(initialStats, this.mapMods);
        }
        if (this.cursors.combatBuff.getCurrentValue() >= 0) {
            initialStats = modifyStatValues(initialStats, this.battleMods);
        }
        return initialStats;
    };
    setBaseStats(stats: Stats) {
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
