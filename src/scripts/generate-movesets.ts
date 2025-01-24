import Characters from "../data/characters.json";
import WEAPONS from "../data/weapons";
import PASSIVES from "../data/passives";
import ASSISTS from "../data/assists";
import SPECIALS from "../data/specials";
import { writeFileSync } from "fs";

interface AllowedSkills {
    weapons: string[];
    assists: string[];
    specials: string[];
    A: string[];
    B: string[];
    C: string[];
    S: string[];
}

function generateMoveset(unit: keyof typeof Characters) {
    const unitData = Characters[unit];
    const exclusiveSkills: Omit<AllowedSkills, "S"> = {
        weapons: [],
        assists: [],
        specials: [],
        A: [],
        B: [],
        C: []
    };

    const commonSkills: AllowedSkills = {
        weapons: [],
        assists: [],
        specials: [],
        A: [],
        B: [],
        C: [],
        S: [],
    };

    for (let weapon in WEAPONS) {
        const weaponData = WEAPONS[weapon];
        if (weaponData.type !== unitData.weaponType) continue;
        if (weaponData.color && weaponData.color !== unitData.color) continue;
        if (weaponData.exclusiveTo) {
            if (weaponData.exclusiveTo.includes(unit)) {
                exclusiveSkills.weapons.push(weapon);
            }
            continue;
        }

        commonSkills.weapons.push(weapon);
    }

    for (let assist in ASSISTS) {
        const assistData = ASSISTS[assist];
        // @ts-ignore
        if (assistData.allowedMovementTypes && !assistData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (assistData.allowedWeaponTypes && !assistData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (assistData.exclusiveTo) {
            if (assistData.exclusiveTo.includes(unit)) {
                exclusiveSkills.assists.push(assist);
            }
            continue;
        }

        commonSkills.assists.push(assist);
    }

    for (let special in SPECIALS) {
        const specialData = SPECIALS[special];
        // @ts-ignore
        if (specialData.allowedMovementTypes && !specialData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (specialData.allowedWeaponTypes && !specialData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (specialData.exclusiveTo) {
            if (specialData.exclusiveTo.includes(unit)) {
                exclusiveSkills.specials.push(special);
            }
            continue;
        }

        commonSkills.specials.push(special);
    }

    for (let passive in PASSIVES) {
        const passiveData = PASSIVES[passive];
        // @ts-ignore
        if (passiveData.allowedMovementTypes && !passiveData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (passiveData.allowedWeaponTypes && !passiveData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (passiveData.exclusiveTo) {
            if (passiveData.exclusiveTo.includes(unit)) {
                exclusiveSkills[passiveData.slot].push(passive);
            }
            continue;
        }

        commonSkills[passiveData.slot].push(passive);

        if (passiveData.isSacredSeal) {
            commonSkills.S.push(passive);
        }
    }

    return { exclusiveSkills, commonSkills };
};

function outputMoveset(heroName: keyof typeof Characters) {
    const moveset = generateMoveset(heroName);
    writeFileSync(`src/data/movesets/${heroName.replace(": ", "_")}.json`, JSON.stringify(moveset));
}

for (let character in Characters) {
    outputMoveset(character as keyof typeof Characters);
    console.log("moveset generated for " + character)
}
