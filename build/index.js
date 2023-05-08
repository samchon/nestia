const cp = require("child_process");
const fs = require("fs");

const PACKAGES = `${__dirname}/../packages`;
const README = `${__dirname}/../README.md`;

const execute = (command) => {
    console.log(command);
    cp.execSync(command, { stdio: "inherit" });
};

const main = () => fs.readdirSync(PACKAGES).forEach((lib) => {
    const location = `${PACKAGES}/${lib}`;
    if (fs.existsSync(`${location}/package.json`) === false)
        return;

    console.log("----------------------------------------");
    console.log(`@nestia/${lib}`);
    console.log("----------------------------------------");
    process.chdir(location);

    fs.copyFileSync(README, "README.md");

    const test = !!JSON.parse(
        fs.readFileSync("package.json", { encoding: "utf-8" })
    ).scripts?.test;

    execute("npm install");
    execute("npm run build");
    if (test) execute("npm run test");
});
main();
