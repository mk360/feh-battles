import { CharacterMoveset } from "./interfaces/character-moveset";

class MovesetManager {
    getCharacterMoveset(name: string) {
        const formattedName = name.replace(":", "_");
        return require(`./data/movesets/${formattedName}.json`);
    }

    checkSkillLearnability(skill: string, moveset: CharacterMoveset) {
        const { exclusiveSkills, commonSkills } = moveset;
        let skills: string[] = [];
        let slot: keyof typeof exclusiveSkills;
        for (slot in exclusiveSkills) {
            skills = skills.concat(exclusiveSkills[slot].map((i) => i.name));
        }

        let otherSlot: keyof typeof commonSkills;
        for (otherSlot in commonSkills) {
            skills = skills.concat(exclusiveSkills[slot].map((i) => i.name));
        }

        return skills.includes(skill);
    }
};

export default new MovesetManager();
