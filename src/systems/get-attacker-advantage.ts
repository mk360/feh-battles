import { Entity } from "ape-ecs";

const ADVANTAGE = 0.2;
const NEUTRAL = 0;
const DISADVANTAGE = -0.2;

function getAttackerAdvantage(attacker: Entity, defender: Entity) {
    if (attacker.getOne("GuaranteedAdvantage")) return ADVANTAGE;
    if (defender.getOne("GuaranteedAdvantage")) return DISADVANTAGE;
    const color1 = attacker.getOne("Weapon").color;
    const color2 = defender.getOne("Weapon").color;

};

export default getAttackerAdvantage;
