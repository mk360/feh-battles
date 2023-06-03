import Weapon from "./weapon";
import { WeaponColor, WeaponType } from "./weapon";
import { Stats, StatsBuffsTable, StatusBuff, HeroSkills, StatusDebuff, MovementType, MandatoryStats, MapCoordinates, Stat } from "./types";
import { CursorsReference } from "./cursor";
import BaseSkill from "./base_skill";
interface Hero {
    name: string;
    id: string;
    baseStats: Stats;
    stats: Stats;
    maxHP: number;
    battleMods: StatsBuffsTable;
    mapBoosts: StatsBuffsTable;
    mapPenalties: StatsBuffsTable;
    positiveStatuses: StatusBuff[];
    negativeStatuses: StatusDebuff[];
    color: WeaponColor;
    skills: HeroSkills;
    movementType: MovementType;
    bane?: keyof MandatoryStats;
    boon?: keyof MandatoryStats;
    coordinates: MapCoordinates;
    allowedWeaponTypes?: WeaponType | WeaponType[];
    allies?: Hero[];
    enemies?: Hero[];
    cursors: CursorsReference;
    statuses: Array<StatusDebuff | StatusBuff>;
}
interface HeroConstructor {
    name: string;
    growthRates: MandatoryStats;
    boon?: keyof MandatoryStats;
    bane?: keyof MandatoryStats;
    lv1Stats: MandatoryStats;
    weaponType: WeaponType;
    movementType: MovementType;
    weaponColor: WeaponColor;
}
declare class Hero {
    constructor(heroConstructor?: HeroConstructor);
    getDistance(hero: Hero): number;
    setAllowedWeaponType(type: WeaponType | WeaponType[]): void;
    setAlly(hero: Hero): this;
    getWeapon(): Weapon;
    lowerCursor(label: keyof CursorsReference, value: number): void;
    raiseCursor(label: keyof CursorsReference, value: number): void;
    setEnemy(hero: Hero): this;
    getMovementType(): MovementType;
    setName(name: string): this;
    setMapBoosts(mods: Stats): this;
    setMapPenalties(mods: Stats): this;
    raiseStat(stat: Stat, value: number): this;
    lowerStat(stat: Stat, value: number): this;
    setBattleMods(mods: StatsBuffsTable): this;
    equipSkill(skill: BaseSkill): this;
    setCoordinates({ x, y }: MapCoordinates): this;
    addStatus(status: StatusBuff | StatusDebuff): this;
    getStatuses(): ("statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses" | "panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma")[];
    setMovementType(type: MovementType): this;
    addBuffIndicator(buffIndicator: StatusBuff): this;
    addDebuffIndicator(debuffIndicator: StatusDebuff): this;
    getCursorValue(label: keyof CursorsReference): number;
    setColor(color: WeaponColor): this;
    setWeapon(weapon: Weapon): this;
    getBattleStats(): Stats;
    getMapStats(): {
        hp?: number;
        atk?: number;
        spd?: number;
        def?: number;
        res?: number;
    };
    setLv1Stats({ stats, growthRates, boon, bane }: {
        stats: MandatoryStats;
        growthRates: MandatoryStats;
        boon?: keyof MandatoryStats;
        bane?: keyof MandatoryStats;
    }): void;
    private setBaseStats;
    applyWeaponBuff(): void;
}
export default Hero;
//# sourceMappingURL=hero.d.ts.map