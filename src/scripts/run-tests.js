const glob = require("fast-glob");
const { spawn } = require("child_process");

const files = glob.sync(["./src/__tests__/**/*.ts", "!./src/__tests__/utils/**/*.ts", "!./src/__tests__/constants/**/*.ts"]);

const child = spawn("node", ["--test",
    // "--test-only",
    "--require", "ts-node/register/transpile-only", ...files], { stdio: "inherit", env: {
    "DEBUG": "1"
} });

child.on("exit", (code) => process.exit(code));