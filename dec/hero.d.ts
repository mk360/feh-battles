import Weapon from "./weapon";
import Skill from "./passive_skill";
import { weaponColor, weaponCategory } from "./weapon";
import { Stats, StatsBuffsTable, heroBuffs, HeroSkills, heroDebuffs, MovementType, MandatoryStats, MovementTypeEnum, MapCoordinates, StatEnum } from "./types";
import { CursorsReference } from "./cursor";
interface Hero {
    name: string;
    id: string;
    baseStats: Stats;
    stats: Stats;
    maxHP: number;
    battleMods: StatsBuffsTable;
    mapMods: StatsBuffsTable;
    positiveStatuses: heroBuffs[];
    negativeStatuses: heroDebuffs[];
    color: weaponColor;
    skills: HeroSkills;
    movementType: MovementType;
    coordinates: MapCoordinates;
    allowedWeaponTypes?: weaponCategory | weaponCategory[];
    allies?: Hero[];
    enemies?: Hero[];
    cursors: CursorsReference;
    statuses: Array<heroDebuffs | heroBuffs>;
}
interface HeroConstructor {
    name: string;
    stats: MandatoryStats;
    weaponType?: weaponCategory;
    weaponColor?: weaponColor;
}
declare class Hero {
    constructor(heroConstructor?: HeroConstructor);
    getDistance(hero: Hero): number;
    setAllowedWeaponType(type: weaponCategory | weaponCategory[]): void;
    setAlly(hero: Hero): this;
    getWeaponProperty(property: keyof Weapon): string | number | (MovementType | "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast")[] | ((color: weaponColor) => Weapon) | ((range: 2 | 1) => Weapon) | ((...targets: (MovementType | "lance" | "axe" | "sword" | "bow" | "dagger" | "tome" | "dragonstone" | "staff" | "beast")[]) => Weapon) | ((slot: import("./base_skill").SkillSlot) => Weapon) | ((newWielder: Hero) => void) | ((effect: import("./base_skill").SkillEffect) => void);
    getWeaponRange(): null | 1 | 2;
    lowerCursor(label: keyof CursorsReference, value: number): void;
    raiseCursor(label: keyof CursorsReference, value: number): void;
    setEnemy(hero: Hero): this;
    getMovementType(): MovementTypeEnum;
    setName(name: string): this;
    setMapMods(mods: Stats): this;
    raiseStat(stat: StatEnum, value: number): this;
    lowerStat(stat: StatEnum, value: number): this;
    setBattleMods(mods: StatsBuffsTable): this;
    equipSkill(skill: Skill | Weapon): this;
    setCoordinates({ x, y }: MapCoordinates): this;
    private addStatus;
    getStatuses(): ("statBuff" | "enhancedMovement" | "dragonEffectiveness" | "doubledBonuses" | "panic" | "limitedMovement" | "statDebuff" | "cannotCounterattack" | "trilemma")[];
    setMovementType(type: MovementTypeEnum): this;
    addBuffIndicator(buffIndicator: heroBuffs): this;
    addDebuffIndicator(debuffIndicator: heroDebuffs): this;
    getCursorValue(label: keyof CursorsReference): number;
    setColor(color: weaponColor): this;
    setWeapon(weapon: Weapon): this;
    getBattleStats(): Stats;
    setBaseStats(stats: Stats): this;
    private applyWeaponBuff;
}
export default Hero;
//# sourceMappingURL=hero.d.ts.map