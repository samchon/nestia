const cp = require("child_process");
const fs = require("fs");

const main = async () => {
    const directory = (name) => `${__dirname}/../../packages/${name}`;
    const devDependencies = [];

    for (const modulo of await fs.promises.readdir(directory(""))) {
        const content = JSON.parse(
            await fs.promises.readFile(
                `${directory(modulo)}/package.json`,
                "utf8",
            ),
        );
        for (const dependencies of [
            content.dependencies,
            content.devDependencies,
        ])
            for (const [name, version] of Object.entries(dependencies ?? {})) {
                if (name.includes("@nestia") || name.includes("@nestjs")) continue;
                devDependencies.push([name, version]);
            }
        process.chdir(directory(modulo));
        cp.execSync("npm install", { stdio: "ignore" });
        cp.execSync("npm run build", { stdio: "ignore" });
        cp.execSync("npm pack", { stdio: "ignore" });
        devDependencies.push([
            content.name, 
            `../packages/${modulo}/${content.name.replace("@", "").replace("/", "-")}-${content.version}.tgz`
        ]);
    }
    devDependencies.sort((a, b) => a[0].localeCompare(b[0]));

    const content = JSON.parse(
        await fs.promises.readFile(`${__dirname}/../package.json`, "utf8"),
    );
    content.devDependencies = {};
    for (const [name, version] of devDependencies)
        content.devDependencies[name] = version;

    await fs.promises.writeFile(
        `${__dirname}/../package.json`,
        JSON.stringify(content, null, 2),
        "utf8",
    );

    if (fs.existsSync(`${__dirname}/../node_modules`))
        await fs.promises.rm(`${__dirname}/../node_modules`, { recursive: true });
    if (fs.existsSync(`${__dirname}/../package-lock.json`))
        await fs.promises.rm(`${__dirname}/../package-lock.json`);
    cp.execSync("npm install", { cwd: `${__dirname}/..`, stdio: "inherit" });
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
