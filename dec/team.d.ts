import Hero from "./hero";
declare class Team {
    id: string;
    members: {
        [id: string]: Hero;
    };
    constructor();
    addMember(member: Hero): void;
    removeMember(member: Hero): void;
}
export default Team;
//# sourceMappingURL=team.d.ts.map