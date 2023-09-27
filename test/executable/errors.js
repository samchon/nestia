const cp = require("child_process");
const fs = require("fs");

const execute = (name) => {
    console.log("------------------------------------------------");
    console.log(name);
    console.log("------------------------------------------------");

    process.chdir(`${__dirname}/../features/${name}`);
    try {
        cp.execSync(`npx tsc`, { stdio: "inherit" });
    } catch {
        return;
    }
    if (name !== "implicit-error" && !name.includes("method-error"))
        throw new Error(`${name} must be failed in the compilation level.`);
};

const features = fs.readdirSync(`${__dirname}/../features`);
for (const f of features) if (f.includes("-error")) execute(f);
