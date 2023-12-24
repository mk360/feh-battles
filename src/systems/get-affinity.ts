import { Entity } from "ape-ecs";
import { WeaponColor } from "../weapon";

// todo: improve when building Cancel Affinity skills
function getAffinity(unit1: Entity, unit2: Entity) {
    if (unit2.getOne("NeutralizeAffinity")) return 0;
    if (unit1.getOne("GuaranteedAffinity")) return 20;

    const { color: color1 } = unit1.getOne("WeaponType");
    const { color: color2 } = unit2.getOne("WeaponType");
    let colorRelationship: "advantage" | "disadvantage" | "neutral" = getColorRelationship(color1, color2);

    if (unit1.getOne("ReverseAffinity") && colorRelationship === "disadvantage") {
        colorRelationship = "advantage";
    }

    if (unit2.getOne("ReverseAffinity") && colorRelationship === "advantage") {
        colorRelationship = "disadvantage";
    }
    
    return colorRelationship === "advantage" ? 20 : colorRelationship === "disadvantage" ? -20 : 0;
};

function getColorRelationship(color1: WeaponColor, color2: WeaponColor) {
    if ((color1 === "red" && color2 === "blue") || (color1 === "blue" && color2 === "green") || (color1 === "green" && color2 === "red")) return "disadvantage";
    if ((color1 === "red" && color2 === "green") || (color1 === "blue" && color2 === "red") || (color1 === "green" && color2 === "blue")) return "advantage";
    return "neutral";
}

export default getAffinity;
