import Characters from "./data/characters";
import PASSIVES from "./data/passives";
import canLearnPassive from "./utils/can-learn-passive";

interface ValidationHero {
    name: string;
    weapon: string;
    assist: string;
    special: string;
    merges: number;
    A: string;
    B: string;
    C: string;
    S: string;
}

const Problems = {
    InvalidValue: 0,
    IncompatibleMovement: 1,
    IncompatibleWeapon: 2,
    IncompatibleColor: 3,
    ExclusiveSkill: 4,
};

class Validator {
    validateTeam(team: ValidationHero[]) {
        const errors = team.map(this.validateHero).flat();
        return {
            valid: !errors.length,
            errors,
        };
    }

    validateHero(hero: ValidationHero) {
        const errors: {
            hero: string;
            property: string;
            problem: number
        }[] = [];
        if (hero.merges < 0 || hero.merges > 10) {
            errors.push({
                hero: hero.name,
                property: "merges",
                problem: Problems.InvalidValue,
            });
        }

        for (let property in ["A", "B", "C"]) {
            if (property) {
                if (!(hero[property] in PASSIVES)) {
                    errors.push({
                        hero: hero.name,
                        property,
                        problem: Problems.InvalidValue
                    });
                }
                const canLearn = canLearnPassive(hero.name, hero[property], property);
                if (!canLearn.learns) {
                    const { reason } = canLearn;
                    switch (reason) {
                        case "weapon":
                            errors.push({
                                hero: hero.name,
                                property,
                                problem: Problems.IncompatibleWeapon,
                            });
                            break;
                        case "color":
                            errors.push({
                                hero: hero.name,
                                property,
                                problem: Problems.IncompatibleColor
                            });
                            break;
                        case "invalid":
                            errors.push({
                                hero: hero.name,
                                property,
                                problem: Problems.InvalidValue,
                            });
                            break;
                        case "exclusive":
                            errors.push({
                                hero: hero.name,
                                property,
                                problem: Problems.ExclusiveSkill,
                            });
                            break;
                        case "movement":
                            errors.push({
                                hero: hero.name,
                                property,
                                problem: Problems.IncompatibleMovement,
                            });
                    }
                }
            }
        }

        return errors;
    };
};

export default Validator;
