import cp from "child_process";
import fs from "fs";

import { ArrayUtil, TestValidator } from "@nestia/e2e";

const library = (name: string) => `${__dirname}/../../packages/${name}`;
const feature = (name: string) => `${__dirname}/../features/${name}`;

const build = async (name: string): Promise<void> => {
    process.chdir(library(name));

    console.log(`Building @nestia/${name}`);
    cp.execSync("npm install", { stdio: "ignore" });
    cp.execSync("npm run build", { stdio: "ignore" });

    const pack: { scripts: Record<string, string> } = JSON.parse(
        await fs.promises.readFile("package.json", "utf8"),
    );
    if (pack.scripts.test !== undefined)
        cp.execSync("npm run test", { stdio: "ignore" });
};

const execute = (name: string, i: number): void => {
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
        TestValidator.error("compile error")(compile);
        return;
    } else compile();

    // GENERATE SWAGGER & SDK
    const configured: boolean = fs.existsSync(
        `${feature(name)}/nestia.config.ts`,
    );
    const elements: string[] = configured
        ? []
        : fs.existsSync("src/controllers")
        ? ["src/controllers"]
        : ["src/**.controller.ts"];

    const generate = (type: "sdk" | "swagger") => {
        console.log(`  - npx nestia ${type}`);

        const command: string = `node ${library("sdk")}/lib/executable/sdk`;
        const argv: string = `${type} ${elements.join(" ")}`;
        cp.execSync(`${command} ${argv}`, { stdio: "inherit" });
    };
    generate("swagger");
    generate("sdk");

    // RUN TEST AUTOMATION PROGRAM
    if (fs.existsSync("src/test")) {
        console.log("  - npx ts-node src/test");
        cp.execSync("npx ts-node src/test", { stdio: "inherit" });
    }
};

const main = async (): Promise<void> => {
    const title = (name: string) =>
        console.log(
            "\n" +
                "===================================================\n" +
                `  ${name}\n` +
                "===================================================",
        );

    if (process.argv.find((str) => str === "--skipBuild") === undefined) {
        title("BUILD LIBRARIES");
        await ArrayUtil.asyncForEach(
            await fs.promises.readdir(library("")),
            build,
        );
    }

    title("TEST FEATURES");
    (await fs.promises.readdir(feature(""))).forEach(execute);
};

main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
