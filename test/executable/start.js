const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const libraryDirectory = (name) => `${__dirname}/../../packages/${name}`;
const featureDirectory = (name) => `${__dirname}/../features/${name}`;

const build = async (name) => {
    process.chdir(libraryDirectory(name));
    fs.writeFileSync(
        "README.md", 
        fs.readFileSync(__dirname + "/../../README.md", "utf8"),
        "utf8"
    );

    process.stdout.write(`  - @nestia/${name}`);
    cp.execSync("npm install", { stdio: "inherit" });
    cp.execSync("npm run build", { stdio: "inherit" });
    cp.execSync("npm pack", { stdio: "inherit" });

    const pack = JSON.parse(
        await fs.promises.readFile("package.json", "utf8"),
    );
    if (pack.scripts.test !== undefined &&
        process.argv.includes("--skipTest") === false
    )
        cp.execSync("npm run test", { stdio: "inherit" });

    return {
        name: pack.name,
        location: `../packages/${name}/${pack.name.replace("@", "").replace("/", "-")}-${pack.version}.tgz`
    };
};

const feature = (name) => {
    // MOVE TO THE DIRECTORY
    process.chdir(featureDirectory(name));
    process.stdout.write(`  - ${name}`);

    // PREPARE ASSETS
    const configured = fs.existsSync(
        `${featureDirectory(name)}/nestia.config.ts`,
    );
    const input = configured
        ? null
        : fs.existsSync("src/controllers")
            ? "src/controllers"
            : "src/**/*.controller.ts";

    const generate = (type) => {
        const argv = input !== null
            ? type === "swagger"
                ? `${type} ${input} --out swagger.json`
                : `${type} ${input} --out src/api`
            : type;
        const command = `npx nestia`;
        cp.execSync(`${command} ${argv}`, { stdio: "inherit" });
    };

    // ERROR MODE HANDLING
    if (name.includes("error")) {
        try {
            TestValidator.error("compile error")(() => {
                cp.execSync("npx tsc", { stdio: "ignore" });
                generate("sdk");
            });
            throw new Error("compile error must be occured.");
        }
        catch {
            return;
        }
    }
    else if (name === "verbatimModuleSyntax") {
        cp.execSync("npx tsc", { stdio: "inherit" });
        return;
    }

    // GENERATE SWAGGER & SDK & E2E
    for (const file of [
        "swagger.json", 
        "src/api/functional", 
        "src/api/HttpError.ts",
        "src/api/IConnection.ts",
        "src/api/index.ts",
        "src/api/module.ts",
        "src/api/Primitive.ts",
        "src/test/features/api/automated"
    ])
        cp.execSync(`npx rimraf ${file}`, { stdio: "inherit" });

    if (name.includes("distribute"))
        cp.execSync(`npx rimraf packages/api`, { stdio: "inherit" });

    generate("swagger");
    generate("sdk");
    if (input === null) {
        const config = fs.readFileSync(
            `${featureDirectory(name)}/nestia.config.ts`, 
            "utf8"
        );
        if (config.includes("e2e:")) generate("e2e");
    }
    cp.execSync("npx tsc", { stdio: "inherit" });

    // RUN TEST AUTOMATION PROGRAM
    if (fs.existsSync("src/test"))
        cp.execSync("npx ts-node src/test", { stdio: "inherit" });
};

const migrate = (name) => {
    const input = path.resolve(`${__dirname}/../features/${name}/swagger.json`);
    const output = path.resolve(`${__dirname}/../migrated/${name}`);
    const cwd = path.resolve(`${__dirname}/../migrated`);

    process.stdout.write(`  - ${name}`);
    cp.execSync(
        `npx @nestia/migrate ${input} ${output}`, 
        { 
            stdio: "inherit",
            cwd,
        }
    );
}

const main = async () => {
    const measure = (title) => async (task) => {
        const time = Date.now();
        await task();
        const elapsed = Date.now() - time;
        console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
    }

    const library = (() => {
        const index = process.argv.findIndex(str => str === "--library");
        return (index === -1 || process.argv.length < index + 2)
            ? null
            : process.argv[index + 1] ?? null;
    })();
    await measure("\nTotal Elapsed Time")(async () => {
        if (!process.argv.find((str) => str === "--skipBuild")) {
            console.log("Build Packages");
            const modules = [];
            for (const name of await fs.promises.readdir(libraryDirectory("")))
                if (name === (library ?? name))
                    await measure("")(async () => {
                        modules.push(await build(name));
                    });

            const pack = JSON.parse(
                await fs.promises.readFile(`${__dirname}/../package.json`, "utf8")
            );
            for (const { name, location } of modules)
                pack.devDependencies[name] = location;
            await fs.promises.writeFile(
                `${__dirname}/../package.json`,
                JSON.stringify(pack, null, 2),
                "utf8"
            );
            cp.execSync("npm install", { 
                cwd: __dirname + "/..", 
                stdio: "inherit", 
            })
        }

        const only = (() => {
            const index = process.argv.findIndex(str => str === "--only");
            return (index === -1 || process.argv.length < index + 2)
                ? null
                : process.argv[index + 1] ?? null;
        })();

        console.log("\nTest Features");
        if (!process.argv.includes("--skipFeatures")) {
            for (const name of await fs.promises.readdir(featureDirectory("")))
                if (name === (only ?? name))
                    await measure()(async () => feature(name));
        }

        console.log("\nMigration Tests");
        if (!process.argv.includes("--skipMigrates")) {
            if (fs.existsSync(`${__dirname}/../migrated`))
                fs.rmSync(`${__dirname}/../migrated`, { recursive: true });
            fs.mkdirSync(`${__dirname}/../migrated`);
            
            for (const name of ["body", "date", "param", "plain", "query"])
                if (name === (only ?? name))
                    await measure()(async () => migrate(name));
        }
    });
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
