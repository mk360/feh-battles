import Characters from "../data/characters";
import PASSIVES from "../data/passives";
import WEAPONS from "../data/weapons";
import ASSISTS from "../data/assists";
import SPECIALS from "../data/specials";
import { ValidationHero } from "./interfaces";
import movesetManager from "../moveset-manager";

export interface ValidationRule {
    name: string;
    validate(team: ValidationHero[]): string[];
}

export class ValidDataRule implements ValidationRule {
    name = "Valid Data Rule";
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];

        team.forEach((hero) => {
            if (!Characters[hero.name]) errors.push(`"${hero.name}" (${hero.name}) doesn't exist as a character.`);
            if (hero.weapon && !WEAPONS[hero.weapon]) errors.push(`"${hero.weapon}" (${hero.name}) doesn't exist as a Weapon.`);
            if (hero.assist && !ASSISTS[hero.assist]) errors.push(`"${hero.assist}" (${hero.name}) doesn't exist as an Assist.`);
            if (hero.special && !SPECIALS[hero.special]) errors.push(`"${hero.special}" (${hero.name}) doesn't exist as a Special.`);
            if (hero.A && !PASSIVES[hero.A]) errors.push(`"${hero.A}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.B && !PASSIVES[hero.B]) errors.push(`"${hero.B}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.C && !PASSIVES[hero.C]) errors.push(`"${hero.C}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.S && !PASSIVES[hero.S]) errors.push(`"${hero.S}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.merges < 0 || hero.merges > 10 || Math.floor(hero.merges) !== hero.merges) errors.push(`${hero.name}'s merges should be an integer between 0 and 10.`);
        });

        return errors;
    };
}

export class StrictSkillSlot implements ValidationRule {
    name = "Strict Skill Slot Rule";
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];

        team.forEach((hero) => {
            if (!WEAPONS[hero.weapon]) errors.push(`"${hero.weapon}" (${hero.name}) doesn't exist as a Weapon.`);
            if (!ASSISTS[hero.assist]) errors.push(`"${hero.assist}" (${hero.name}) doesn't exist as an Assist.`);
            if (!SPECIALS[hero.special]) errors.push(`"${hero.special}" (${hero.name}) doesn't exist as a Special.`);
            if (hero.A && PASSIVES[hero.A].slot !== "A") errors.push(`"${hero.A}" (${hero.name}) doesn't exist as an A Passive.`);
            if (hero.B && PASSIVES[hero.B].slot !== "B") errors.push(`"${hero.B}" (${hero.name}) doesn't exist as a B Passive.`);
            if (hero.C && PASSIVES[hero.C].slot !== "C") errors.push(`"${hero.C}" (${hero.name}) doesn't exist as a C Passive.`);
        });

        return errors;
    }
};

export class StrictSacredSeal implements ValidationRule {
    name = "Sacred Seal Validity";
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];

        team.forEach((hero) => {
            if (hero.S && !PASSIVES[hero.S].isSacredSeal) errors.push(`"${hero.S}" (${hero.name}) is not a Sacred Seal.`);
        });

        return errors;
    }
}

export class StrictLearnset implements ValidationRule {
    name = "Learnability";
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];
        team.forEach((hero) => {
            const moveset = movesetManager.getCharacterMoveset(hero.name);
            if (!!hero.weapon && !movesetManager.checkSkillLearnability(hero.weapon, moveset)) errors.push(`${hero.name} cannot equip the Weapon ${hero.weapon}`);
            if (!!hero.assist && !movesetManager.checkSkillLearnability(hero.assist, moveset)) errors.push(`${hero.name} cannot equip the Assist ${hero.assist}`);
            if (!!hero.special && !movesetManager.checkSkillLearnability(hero.special, moveset)) errors.push(`${hero.name} cannot equip the Special ${hero.special}`);
            if (!!hero.A && !movesetManager.checkSkillLearnability(hero.A, moveset)) errors.push(`${hero.name} cannot equip the A Passive ${hero.A}`);
            if (!!hero.B && !movesetManager.checkSkillLearnability(hero.B, moveset)) errors.push(`${hero.name} cannot equip the B Passive ${hero.B}`);
            if (!!hero.C && !movesetManager.checkSkillLearnability(hero.C, moveset)) errors.push(`${hero.name} cannot equip the C Passive ${hero.C}`);
            if (!!hero.S && !movesetManager.checkSkillLearnability(hero.S, moveset)) errors.push(`${hero.name} cannot equip the Sacred Seal ${hero.S}`);
        });

        return errors;
    }
}

export class SingleHeroRule implements ValidationRule {
    name = "Single Hero Rule"
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];
        const checked: string[] = [];
        team.forEach((hero) => {
            const instances = team.filter((i) => i.name === hero.name).length;
            if (instances > 1 && !checked.includes(hero.name)) {
                errors.push(`${hero.name} should only be present in the team once.`);
            }
            checked.push(hero.name);
        });

        return errors;
    }
}