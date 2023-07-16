import shortid from "shortid";
import Hero from "./hero";

class Team {
    id = shortid();
    members: {
        [id: string]: Hero
    };

    constructor() {
        this.members = {};
    }

    addMember(member: Hero) {
        this.members[member.id] = member;
    }

    removeMember(member: Hero) {
        delete this.members[member.id];
    }
}

export default Team;
