#!/usr/bin/env node

import * as cp from "child_process";
import * as process from "process";
import { NestiaCommand } from "./internal/NestiaCommand";

function install(): void
{
    // INSTALL DEPENDENCIES
    for (const lib of ["nestia-fetcher", "typescript-is", "typescript-json"])
    {
        const command: string = `npm install ${lib}`;
        cp.execSync(command, { stdio: "inherit" });
    }
}

async function main()
{
    const argv: string[] = process.argv.slice(3);
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
        await NestiaCommand.sdk(argv);
    else if (process.argv[2] === "swagger")
        await NestiaCommand.swagger(argv);
    else
        throw new Error(`nestia supports only three commands; (install, sdk, swagger), however you've typed the "${process.argv[2]}"`);
}
main().catch(exp =>
{
    console.log(exp.message);
    process.exit(-1);
});