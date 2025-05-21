import { ValidationHero } from "./validators/interfaces";
import { SingleHeroRule, StrictLearnset, TeamCountRule, ValidationRule, ValidDataRule } from "./validators/validators";

class Validator {
    rules: ValidationRule[];
    constructor(rules: ValidationRule[]) {
        this.rules = rules;
    }

    validateTeam(team: ValidationHero[]) {
        const errors: {
            [k: string]: string[]
        } = {};

        for (let rule of this.rules) {
            const ruleErrors = rule.validate(team);
            if (ruleErrors.length) {
                errors[rule.name] = ruleErrors;
            }
        }

        return errors;
    }
};

export default new Validator([new TeamCountRule(), new ValidDataRule(), new SingleHeroRule(), new StrictLearnset()]);
