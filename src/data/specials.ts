import { Entity } from "ape-ecs";
import MovementType from "../components/movement-type";
import Skill from "../components/skill";
import { WeaponType } from "../weapon";
import Characters from "./characters.json";

interface SpecialsDict {
    [k: string]: {
        description: string;
        cooldown: number;
        allowedWeaponTypes?: WeaponType[];
        exclusiveTo?: (keyof typeof Characters)[];
        allowedMovementTypes?: MovementType[];
        onCombatRoundAttack?(this: Skill, target: Entity): void;
        onCombatRoundDefense?(this: Skill, target: Entity): void;
    }
}

const SPECIALS: SpecialsDict = {

};

export default SPECIALS;
