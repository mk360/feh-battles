interface SkillWithDescription {
    name: string;
    description: string;
}

export interface SkillList {
    weapons: SkillWithDescription[];
    assists: SkillWithDescription[];
    specials: SkillWithDescription[];
    A: SkillWithDescription[];
    B: SkillWithDescription[];
    C: SkillWithDescription[];
    S: SkillWithDescription[];
};

export interface CharacterMoveset {
    exclusiveSkills: Omit<SkillList, "S">;
    commonSkills: SkillList;
}
