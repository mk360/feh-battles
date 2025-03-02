import { writeFileSync } from "fs";
import characterData from "../../data/characters.json";

type StatLine = ReturnType<typeof getStatsFromLine>;

(async function fct() {
    const map: {
        [k: string]: StatLine;
    } = {};
    for (let character in characterData) {
        const fullTable = await fetch(`https://feheroes.fandom.com/wiki/${character.replace(/ /g, "_")}/Level_1-40_stats`).then((resp) => resp.text());
        const individualStats = fullTable.substring(fullTable.indexOf("<table>"), fullTable.indexOf("</table>")).split(/(<td>|<\/td>)/).filter((i) => +i).map(i => +i);
        const lv40StatLine = getStatsFromLine(individualStats.slice(-15));
        map[character] = lv40StatLine;

        console.log(character);
    }
    writeFileSync("./src/__tests__/lv40_stats.json", JSON.stringify(map, null, 2));
})();

function getStatsFromLine(line: number[]) {
    return {
        hp: {
            bane: line[0],
            standard: line[1],
            boon: line[2],
        },
        atk: {
            bane: line[3],
            standard: line[4],
            boon: line[5],
        },
        spd: {
            bane: line[6],
            standard: line[7],
            boon: line[8],
        },
        def: {
            bane: line[9],
            standard: line[10],
            boon: line[11],
        },
        res: {
            bane: line[12],
            standard: line[13],
            boon: line[14]
        }
    };
}


export { }