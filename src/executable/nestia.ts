#!/usr/bin/env node

import cp from "child_process";
import fs from "fs";
import process from "process";

import type { NestiaCommand } from "./internal/NestiaCommand";
import { NestiaStarter } from "./internal/NestiaStarter";

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

async function execute(
    closure: (commander: typeof NestiaCommand) => Promise<void>,
): Promise<void> {
    const module = await import("./internal/NestiaCommand");
    await closure(module.NestiaCommand);
}

async function main() {
    const type: string | undefined = process.argv[2];
    const argv: string[] = process.argv.slice(3);

    if (type === "start") await NestiaStarter.start(argv[0]);
    else if (type === "install") dependencies();
    else if (type === "init") await initialize();
    else if (type === "sdk") await execute((c) => c.sdk(argv));
    else if (type === "swagger") await execute((c) => c.swagger(argv));
    else
        throw new Error(
            `nestia supports only five commands; (start, install, init, sdk and swagger), however you've typed the "${process.argv[2]}"`,
        );
}
main().catch((exp) => {
    console.log(exp.message);
    process.exit(-1);
});
