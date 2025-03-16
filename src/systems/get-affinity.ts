import { Entity } from "ape-ecs";
import { WeaponColor } from "../interfaces/types";

// todo: improve when building Cancel Affinity skills
function getAffinity(unit1: Entity, unit2: Entity) {
    if (unit2.getOne("NeutralizeAffinity")) return 0;
    if (unit1.getOne("GuaranteedAffinity")) return 0.2;
    if (unit2.getOne("GuaranteedAffinity")) return -0.2;

    const { color: color1 } = unit1.getOne("Weapon");
    const { color: color2 } = unit2.getOne("Weapon");
    let colorRelationship: "advantage" | "disadvantage" | "neutral" = getColorRelationship(color1, color2);

    if ((unit1.getOne("ReverseAffinity") || unit2.getOne("ReverseAffinity")) && colorRelationship === "disadvantage") {
        colorRelationship = "advantage";
    } else if ((unit1.getOne("ReverseAffinity") || unit2.getOne("ReverseAffinity")) && colorRelationship === "advantage") {
        colorRelationship = "disadvantage";
    }

    const maxAffinity = Math.max(unit1.getOne("ApplyAffinity")?.value ?? 0, unit2.getOne("ApplyAffinity")?.value ?? 0);

    return colorRelationship === "advantage" ? maxAffinity / 100 : colorRelationship === "disadvantage" ? -maxAffinity / 100 : 0;
};

export function getColorRelationship(color1: WeaponColor, color2: WeaponColor) {
    if ((color1 === "red" && color2 === "blue") || (color1 === "blue" && color2 === "green") || (color1 === "green" && color2 === "red")) return "disadvantage";
    if ((color1 === "red" && color2 === "green") || (color1 === "blue" && color2 === "red") || (color1 === "green" && color2 === "blue")) return "advantage";
    return "neutral";
}

export default getAffinity;
