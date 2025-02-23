import * as fs from "fs";
import ts, { SyntaxKind } from "typescript";
const dir = fs.readdirSync("./src/components");
const sourceFiles = dir.map((file) => (`./src/components/${file}`)).map((file) => {
    return ts.createSourceFile(file, fs.readFileSync(file, "utf-8"), ts.ScriptTarget.Latest);
});

const commentedComponents: { component: string, comment: string }[] = [];

for (let file of sourceFiles) {
    ts.forEachChild(file, (node) => {
        if (node.kind === SyntaxKind.ClassDeclaration) {
            // @ts-ignore
            const componentName = node.name.escapedText as string;
            // @ts-ignore
            const comment = node.jsDoc?.[0].comment as string;
            if (!comment) {
                console.warn(`No comment found for component ${componentName}`)
            } else {
                commentedComponents.push({
                    comment,
                    component: componentName
                });
            }
        }
    });
}

const docTitle = "These are the Component the Engine currently uses. This is an auto-generated documentation.";
let firstColumnLength = "Component".length;
let secondColumnLength = "Description".length;
let maxFirstColumnLength = Math.max.apply(null, [firstColumnLength].concat(commentedComponents.map((comp) => comp.component.length)));
let maxSecondColumnLength = Math.max.apply(null, [secondColumnLength].concat(commentedComponents.map((comp) => comp.comment.length)));
const lines: string[][] = [["Component" + " ".repeat(maxFirstColumnLength - firstColumnLength), "Description" + " ".repeat(maxSecondColumnLength - secondColumnLength)]];

for (let commented of commentedComponents) {
    const { component, comment } = commented;
    const line = [component + " ".repeat(maxFirstColumnLength - component.length), comment + " ".repeat(maxSecondColumnLength - comment.length)];
    lines.push(line);
}

let finalString = docTitle + "\n\n";
finalString += writeTableLine(lines[0]);
finalString += writeTableLine(["-".repeat(maxFirstColumnLength), "-".repeat(maxSecondColumnLength)]);

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    finalString += writeTableLine(line);
}

function writeTableLine(line: string[]) {
    return `| ${line[0]} | ${line[1]} |\n`;
}

fs.writeFileSync("./docs/components.md", finalString)