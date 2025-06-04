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
            if (hero.skills.weapon && !WEAPONS[hero.skills.weapon]) errors.push(`"${hero.skills.weapon}" (${hero.name}) doesn't exist as a Weapon.`);
            if (hero.skills.assist && !ASSISTS[hero.skills.assist]) errors.push(`"${hero.skills.assist}" (${hero.name}) doesn't exist as an Assist.`);
            if (hero.skills.special && !SPECIALS[hero.skills.special]) errors.push(`"${hero.skills.special}" (${hero.name}) doesn't exist as a Special.`);
            if (hero.skills.A && !PASSIVES[hero.skills.A]) errors.push(`"${hero.skills.A}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.skills.B && !PASSIVES[hero.skills.B]) errors.push(`"${hero.skills.B}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.skills.C && !PASSIVES[hero.skills.C]) errors.push(`"${hero.skills.C}" (${hero.name}) doesn't exist as a Passive.`);
            if (hero.skills.S && !PASSIVES[hero.skills.S]) errors.push(`"${hero.skills.S}" (${hero.name}) doesn't exist as a Passive.`);
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
            if (!WEAPONS[hero.skills.weapon]) errors.push(`"${hero.skills.weapon}" (${hero.name}) doesn't exist as a Weapon.`);
            if (!ASSISTS[hero.skills.assist]) errors.push(`"${hero.skills.assist}" (${hero.name}) doesn't exist as an Assist.`);
            if (!SPECIALS[hero.skills.special]) errors.push(`"${hero.skills.special}" (${hero.name}) doesn't exist as a Special.`);
            if (hero.skills.A && PASSIVES[hero.skills.A].slot !== "A") errors.push(`"${hero.skills.A}" (${hero.name}) doesn't exist as an A Passive.`);
            if (hero.skills.B && PASSIVES[hero.skills.B].slot !== "B") errors.push(`"${hero.skills.B}" (${hero.name}) doesn't exist as a B Passive.`);
            if (hero.skills.C && PASSIVES[hero.skills.C].slot !== "C") errors.push(`"${hero.skills.C}" (${hero.name}) doesn't exist as a C Passive.`);
        });

        return errors;
    }
};

export class StrictSacredSeal implements ValidationRule {
    name = "Sacred Seal Validity";
    validate(team: ValidationHero[]): string[] {
        const errors: string[] = [];

        team.forEach((hero) => {
            if (hero.skills.S && !PASSIVES[hero.skills.S].isSacredSeal) errors.push(`"${hero.skills.S}" (${hero.name}) is not a Sacred Seal.`);
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
            if (!!hero.skills.weapon && !movesetManager.checkSkillLearnability(hero.skills.weapon, moveset)) errors.push(`${hero.name} cannot equip the Weapon ${hero.skills.weapon}`);
            if (!!hero.skills.assist && !movesetManager.checkSkillLearnability(hero.skills.assist, moveset)) errors.push(`${hero.name} cannot equip the Assist ${hero.skills.assist}`);
            if (!!hero.skills.special && !movesetManager.checkSkillLearnability(hero.skills.special, moveset)) errors.push(`${hero.name} cannot equip the Special ${hero.skills.special}`);
            if (!!hero.skills.A && !movesetManager.checkSkillLearnability(hero.skills.A, moveset)) errors.push(`${hero.name} cannot equip the A Passive ${hero.skills.A}`);
            if (!!hero.skills.B && !movesetManager.checkSkillLearnability(hero.skills.B, moveset)) errors.push(`${hero.name} cannot equip the B Passive ${hero.skills.B}`);
            if (!!hero.skills.C && !movesetManager.checkSkillLearnability(hero.skills.C, moveset)) errors.push(`${hero.name} cannot equip the C Passive ${hero.skills.C}`);
            if (!!hero.skills.S && !movesetManager.checkSkillLearnability(hero.skills.S, moveset)) errors.push(`${hero.name} cannot equip the Sacred Seal ${hero.skills.S}`);
        });

        return errors;
    }
}

export class TeamCountRule implements ValidationRule {
    name = "Team Count Rule";
    validate(team: ValidationHero[]): string[] {
        if (!team.length || team.length > 4) {
            return ["There should be at least one team member and not more than 4."];
        }

        return [];
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