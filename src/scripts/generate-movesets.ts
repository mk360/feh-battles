import Characters from "../data/characters.json";
import WEAPONS from "../data/weapons";
import PASSIVES from "../data/passives";
import ASSISTS from "../data/assists";
import SPECIALS from "../data/specials";
import { writeFileSync } from "fs";
import { SkillList, CharacterMoveset } from "../interfaces/character-moveset";
import { WeaponColor } from "../interfaces/types";

function generateMoveset(unit: keyof typeof Characters): CharacterMoveset {
    const unitData = Characters[unit];
    const exclusiveSkills: Omit<SkillList, "S"> = {
        weapons: [],
        assists: [],
        specials: [],
        A: [],
        B: [],
        C: []
    };

    const commonSkills: SkillList = {
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
                exclusiveSkills.weapons.push({
                    name: weapon,
                    description: weaponData.description,
                    might: weaponData.might
                });
            }
            continue;
        }

        commonSkills.weapons.push({
            name: weapon,
            description: weaponData.description,
            might: weaponData.might
        });
    }

    commonSkills.weapons = commonSkills.weapons.sort((a, b) => a.name.localeCompare(b.name));

    for (let assist in ASSISTS) {
        const assistData = ASSISTS[assist];
        // @ts-ignore
        if (assistData.allowedMovementTypes && !assistData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (assistData.allowedWeaponTypes && !assistData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (assistData.exclusiveTo) {
            if (assistData.exclusiveTo.includes(unit)) {
                exclusiveSkills.assists.push({
                    name: assist,
                    description: assistData.description
                });
            }
            continue;
        }

        commonSkills.assists.push({
            name: assist,
            description: assistData.description
        });
    }

    commonSkills.assists = commonSkills.assists.sort((a, b) => a.name.localeCompare(b.name));

    for (let special in SPECIALS) {
        const specialData = SPECIALS[special];
        // @ts-ignore
        if (specialData.allowedMovementTypes && !specialData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (specialData.allowedWeaponTypes && !specialData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (specialData.exclusiveTo) {
            if (specialData.exclusiveTo.includes(unit)) {
                exclusiveSkills.specials.push({
                    name: special,
                    description: specialData.description
                });
            }
            continue;
        }

        commonSkills.specials.push({
            name: special,
            description: specialData.description
        });
    }

    for (let passive in PASSIVES) {
        const passiveData = PASSIVES[passive];
        // @ts-ignore
        if (passiveData.allowedMovementTypes && !passiveData.allowedMovementTypes.includes(unitData.movementType)) continue;
        // @ts-ignore
        if (passiveData.allowedWeaponTypes && !passiveData.allowedWeaponTypes.includes(unitData.weaponType)) continue;
        if (passiveData.allowedColors && !passiveData.allowedColors.includes(unitData.color as WeaponColor)) continue;
        if (passiveData.exclusiveTo) {
            if (passiveData.exclusiveTo.includes(unit)) {
                exclusiveSkills[passiveData.slot].push({
                    name: passive,
                    description: passiveData.description
                });
            }
            continue;
        }

        commonSkills[passiveData.slot].push({
            name: passive,
            description: passiveData.description
        });

        if (passiveData.isSacredSeal) {
            commonSkills.S.push({
                name: passive,
                description: passiveData.description
            });
        }
    }

    commonSkills.A = commonSkills.A.sort((a, b) => a.name.localeCompare(b.name));
    commonSkills.B = commonSkills.B.sort((a, b) => a.name.localeCompare(b.name));
    commonSkills.C = commonSkills.C.sort((a, b) => a.name.localeCompare(b.name));
    commonSkills.S = commonSkills.S.sort((a, b) => a.name.localeCompare(b.name));

    return { exclusiveSkills, commonSkills };
};

function outputMoveset(heroName: keyof typeof Characters) {
    const moveset = generateMoveset(heroName);
    writeFileSync(`src/data/movesets/${heroName.replace(": ", "_")}.json`, JSON.stringify(moveset, null, 2));
}

for (let character in Characters) {
    outputMoveset(character as keyof typeof Characters);
    console.log("moveset generated for " + character)
}
