import skills from "../../data/skill-dex";
import jsonDump  from "./book1-dump.json";
import * as fs from "fs";

const skillsToRemove: string[] = [];

for (let skill in skills) {
    if (!jsonDump.includes(skill)) {
        skillsToRemove.push(skill);
    }
}

fs.writeFileSync("test.txt", skillsToRemove.join("\n"))
