#!/usr/bin/env node

import cp from "child_process";
import fs from "fs";
import process from "process";

import { NestiaCommand } from "./internal/NestiaCommand";

function dependencies(): void {
    // INSTALL DEPENDENCIES
    for (const lib of ["nestia-fetcher", "typescript-json"]) {
        const command: string = `npm install ${lib}`;
        cp.execSync(command, { stdio: "inherit" });
    }
}

async function initialize(): Promise<void> {
    if (fs.existsSync("nestia.config.ts") === true)
        throw new Error(
            `Error on nestia.initialize(): "nestia.config.ts" file already has been configured.`,
        );

    const content: string = await fs.promises.readFile(
        `${__dirname}/../../preliminaries/nestia.config.ts`,
        "utf8",
    );
    await fs.promises.writeFile("nestia.config.ts", content, "utf8");
}

async function main() {
    const type: string | undefined = process.argv[2];
    const argv: string[] = process.argv.slice(3);

    if (type === "install") dependencies();
    else if (type === "init") await initialize();
    else if (type === "sdk") await NestiaCommand.sdk(argv);
    else if (type === "swagger") await NestiaCommand.swagger(argv);
    else
        throw new Error(
            `nestia supports only three commands; (install, sdk, swagger), however you've typed the "${process.argv[2]}"`,
        );
}
main().catch((exp) => {
    console.log(exp.message);
    process.exit(-1);
});
