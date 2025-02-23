import Characters from "../data/characters.json";
import PASSIVES from "../data/passives";
import { MovementType, WeaponColor, WeaponType } from "../interfaces/types";

function canLearnPassive(hero: string, passive: string, slot: string) {
    if (!(passive in PASSIVES)) return {
        learns: false,
        reason: "invalid"
    };
    const castHero = hero as (keyof typeof Characters);
    const passiveData = PASSIVES[passive];
    const unitData = Characters[castHero];
    if (passiveData.exclusiveTo && !passiveData.exclusiveTo.includes(castHero)) {
        return {
            learns: false,
            reason: "exclusive"
        };
    }
    if (slot !== passiveData.slot) return {
        learns: false,
        reason: "slot",
    };
    if (passiveData.allowedMovementTypes && !passiveData.allowedMovementTypes.includes(unitData.movementType as MovementType)) return {
        learns: false,
        reason: "movement"
    };
    const hasDetailedWeaponsAllowed = passiveData.extraAllowedWeapons?.includes(`${unitData.color as WeaponColor}-${unitData.weaponType as WeaponType}`) ?? false;
    if ((passiveData.allowedWeaponTypes && !passiveData.allowedWeaponTypes.includes(unitData.weaponType as WeaponType)) && !hasDetailedWeaponsAllowed) return {
        learns: false,
        reason: "weapon"
    };
    if ((passiveData.allowedColors && !passiveData.allowedColors.includes(unitData.color as WeaponColor)) && !hasDetailedWeaponsAllowed) return {
        learns: false,
        reason: "color"
    };

    return {
        learns: true,
    };
};

export default canLearnPassive;
