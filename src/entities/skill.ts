import { Entity } from "ape-ecs";

class Skill extends Entity {
    id = "skill";

    onSamir() {
        this.addComponent({
            type: "Weapon",
            weaponType: "Sword",
            range: 1
        });
    }
}

export default Skill;
