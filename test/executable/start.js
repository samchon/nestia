const cp = require("child_process");
const fs = require("fs");
const { publish } = require("../../deploy/publish");

const featureDirectory = (name) => `${__dirname}/../features/${name}`;
const feature = (name) => {
    // MOVE TO THE DIRECTORY
    process.chdir(featureDirectory(name));
    process.stdout.write(`  - ${name}`);

    // PREPARE ASSETS
    const file =
        name === "cli-config" || name === "cli-config-project"
            ? "nestia.configuration.ts"
            : "nestia.config.ts";
    const generate = (type) => {
        const tail =
            name === "cli-config" || name === "cli-config-project"
                ? " --config nestia.configuration.ts"
                : name === "cli-config-project" || name === "cli-project"
                ? " --project tsconfig.nestia.json"
                : "";
        cp.execSync(`npx nestia ${type}${tail}`, { stdio: "ignore" });
    };

    // ERROR MODE HANDLING
    if (name.includes("error"))
        try {
            TestValidator.error("compile error")(() => {
                cp.execSync("npx tsc", { stdio: "ignore" });
                generate("swagger");
                generate("sdk");
            });
            throw new Error("compile error must be occured.");
        } catch {
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
        "src/test/features/api/automated",
    ])
        cp.execSync(`npx rimraf ${file}`, { stdio: "ignore" });

    if (name.includes("distribute"))
        cp.execSync(`npx rimraf packages/api`, { stdio: "ignore" });

    generate("swagger");
    generate("sdk");
    {
        const config = fs.readFileSync(
            `${featureDirectory(name)}/${file}`,
            "utf8",
        );
        if (config.includes("e2e:")) generate("e2e");
    }
    cp.execSync("npx tsc", { stdio: "ignore" });

    // RUN TEST AUTOMATION PROGRAM
    if (fs.existsSync("src/test")) {
        const test = () =>
            cp.execSync("npx ts-node src/test", { stdio: "ignore" });
        for (let i = 0; i < 3; ++i)
            try {
                test();
                return;
            } catch {}
        test();
    }
};

const main = async () => {
    const measure = (title) => async (task) => {
        const time = Date.now();
        await task();
        const elapsed = Date.now() - time;
        console.log(`${title ?? ""}: ${elapsed.toLocaleString()} ms`);
    };

    await measure("\nTotal Elapsed Time")(async () => {
        if (!process.argv.find((str) => str === "--skipBuild"))
            publish("tgz")("0.0.0-dev.20991231");

        console.log("\nTest Features");
        const filter = (() => {
            const only = process.argv.findIndex((str) => str === "--only");
            if (only !== -1 && process.argv.length >= only + 1)
                return (str) => str.includes(process.argv[only + 1]);

            const from = process.argv.findIndex((str) => str === "--from");
            if (from !== -1 && process.argv.length >= from + 1)
                return (str) => str >= process.argv[from + 1];

            return () => true;
        })();
        if (!process.argv.includes("--skipFeatures")) {
            for (const name of await fs.promises.readdir(featureDirectory("")))
                if (filter(name)) await measure()(async () => feature(name));
        }

        // console.log("\nMigration Tests");
        // if (!process.argv.includes("--skipMigrates")) {
        //     if (fs.existsSync(`${__dirname}/../migrated`))
        //         fs.rmSync(`${__dirname}/../migrated`, { recursive: true });
        //     fs.mkdirSync(`${__dirname}/../migrated`);

        //     for (const name of ["body", "date", "head", "param", "plain", "query" ,"security"])
        //         if (name.includes(only ?? name))
        //             await measure()(async () => migrate(name));
        // }
    });
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
