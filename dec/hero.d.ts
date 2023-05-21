import Weapon from "./weapon";
import Skill from "./passive_skill";
import { WeaponColor, WeaponType } from "./weapon";
import { Stats, StatsBuffsTable, StatusBuff, HeroSkills, StatusDebuff, MovementType, MandatoryStats, MapCoordinates, Stat } from "./types";
import { CursorsReference } from "./cursor";
interface Hero {
    name: string;
    id: string;
    baseStats: Stats;
    stats: Stats;
    maxHP: number;
    battleMods: StatsBuffsTable;
    mapMods: StatsBuffsTable;
    positiveStatuses: StatusBuff[];
    negativeStatuses: StatusDebuff[];
    color: WeaponColor;
    skills: HeroSkills;
    movementType: MovementType;
    coordinates: MapCoordinates;
    allowedWeaponTypes?: WeaponType | WeaponType[];
    allies?: Hero[];
    enemies?: Hero[];
    cursors: CursorsReference;
    statuses: Array<StatusDebuff | StatusBuff>;
}
interface HeroConstructor {
    name: string;
    stats: MandatoryStats;
    weaponType?: WeaponType;
    movementType: MovementType;
    weaponColor?: WeaponColor;
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
    setMapMods(mods: Stats): this;
    raiseStat(stat: Stat, value: number): this;
    lowerStat(stat: Stat, value: number): this;
    setBattleMods(mods: StatsBuffsTable): this;
    equipSkill(skill: Skill | Weapon): this;
    setCoordinates({ x, y }: MapCoordinates): this;
    addStatus(status: StatusBuff | StatusDebuff): this;
    getStatuses(): ("panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma" | "statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses")[];
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
    setBaseStats(stats: Stats): this;
    applyWeaponBuff(): void;
}
export default Hero;
//# sourceMappingURL=hero.d.ts.map