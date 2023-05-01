const cp = require("child_process");
const fs = require("fs");

const library = (name) => `${__dirname}/../../packages/${name}`;
const feature = (name) => `${__dirname}/../features/${name}`;

const build = async (name) => {
    process.chdir(library(name));

    console.log(`Building @nestia/${name}`);
    cp.execSync("npm install", { stdio: "ignore" });
    cp.execSync("npm run build", { stdio: "ignore" });

    const pack = JSON.parse(
        await fs.promises.readFile("package.json", "utf8"),
    );
    if (pack.scripts.test !== undefined)
        cp.execSync("npm run test", { stdio: "ignore" });
};

const execute = (name, i) => {
    // MOVE TO THE DIRECTORY
    process.chdir(feature(name));
    console.log(
        "" +
            (i === 0
                ? ""
                : "\n---------------------------------------------------\n") +
            `  ${name}\n` +
            "---------------------------------------------------",
    );

    // COMPILE
    const compile = () => {
        console.log("  - npx tsc");
        cp.execSync("npx tsc");
    };
    if (name.includes("error")) {
        try {
            TestValidator.error("compile error")(compile);
            throw new Error("compile error must be occured.");
        }
        catch {
            return;
        }
    }

    // GENERATE SWAGGER & SDK
    const configured = fs.existsSync(
        `${feature(name)}/nestia.config.ts`,
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
        console.log(`  - npx nestia ${argv}`);

        const command = `node ${library("sdk")}/lib/executable/sdk`;
        cp.execSync(`${command} ${argv}`, { stdio: "inherit" });
    };
    generate("swagger");
    generate("sdk");
    compile();

    // RUN TEST AUTOMATION PROGRAM
    if (fs.existsSync("src/test")) {
        console.log("  - npx ts-node src/test");
        cp.execSync("npx ts-node src/test", { stdio: "inherit" });
    }
};

const main = async () => {
    const title = (name) =>
        console.log(
            "\n" +
                "===================================================\n" +
                `  ${name}\n` +
                "===================================================",
        );

    if (process.argv.find((str) => str === "--skipBuild") === undefined) {
        title("BUILD LIBRARIES");
        for (const name of await fs.promises.readdir(library("")))
            await build(name);
    }

    title("TEST FEATURES");
    (await fs.promises.readdir(feature(""))).forEach(execute);
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
