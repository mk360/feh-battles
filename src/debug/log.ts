const [, , debug] = process.argv;

function log(content: any) {
    if (debug === "debug") console.log(content);
}

export default log;
