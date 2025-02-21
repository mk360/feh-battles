const fs = require("fs");
const dump = require("./validate-movesets/dump.json");
const dir = fs.readdirSync("../data/movesets");
const skills = new Set();
for (let file of dir) {
    const moveset = require(`../data/movesets/${file}`);
    for (let section in moveset) {
        for (let slot in moveset[section]) {
            for (let skill of moveset[section][slot]) {
                skills.add(skill.name);
            }
        }
    }
}
fs.writeFileSync("validate-movesets/subset.json", JSON.stringify(Array.from(skills)));
