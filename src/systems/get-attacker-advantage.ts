import { Entity } from "ape-ecs";
import { WeaponColor } from "../interfaces/types";

const ADVANTAGE = 0.2;
const NEUTRAL = 0;
const DISADVANTAGE = -0.2;

const ADVANTAGE_MAP = {
    red: {
        blue: DISADVANTAGE,
        green: ADVANTAGE
    },
    blue: {
        red: ADVANTAGE,
        green: DISADVANTAGE,
    },
    green: {
        red: DISADVANTAGE,
        blue: ADVANTAGE
    }
} as const;

function getAttackerAdvantage(attacker: Entity, defender: Entity) {
    if (attacker.getOne("GuaranteedAdvantage")) return ADVANTAGE;
    if (defender.getOne("GuaranteedAdvantage")) return DISADVANTAGE;
    const color1 = attacker.getOne("Weapon").color as WeaponColor;
    const color2 = defender.getOne("Weapon").color as WeaponColor;
    if (color1 === color2 || [color1, color2].includes("colorless")) return NEUTRAL;

    return ADVANTAGE_MAP[color1][color2];
};

export default getAttackerAdvantage;
