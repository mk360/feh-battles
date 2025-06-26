import { CharacterMoveset } from "./interfaces/character-moveset";

class MovesetManager {
    getCharacterMoveset(name: string) {
        const formattedName = name.replace(": ", "_");
        return require(`./data/movesets/${formattedName}.json`);
    }

    checkSkillLearnability(skill: string, moveset: CharacterMoveset) {
        const { exclusiveSkills, commonSkills } = moveset;
        let slot: keyof typeof exclusiveSkills;
        for (slot in exclusiveSkills) {
            if (exclusiveSkills[slot].map((i) => i.name).includes(skill)) return true;
        }

        let otherSlot: keyof typeof commonSkills;
        for (otherSlot in commonSkills) {
            if (commonSkills[otherSlot].map((i) => i.name).includes(skill)) return true;
        }

        return false;
    }
};

export default new MovesetManager();
