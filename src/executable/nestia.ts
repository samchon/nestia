#!/usr/bin/env node

import * as cp from "child_process";
import * as process from "process";
import { NestiaSdkCli } from "./internal/NestiaSdkCli";

function install(): void
{
    // INSTALL DEPENDENCIES
    for (const lib of ["nestia-fetcher", "typescript-is"])
    {
        const command: string = `npm install ${lib}`;
        cp.execSync(command, { stdio: "inherit" });
    }
}

async function sdk(): Promise<void>
{
    await NestiaSdkCli.main(process.argv.slice(3));
}
async function main()
{
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
        await sdk();
    else
        throw new Error(`nestia supports only two commands; install and sdk, however you've typed the "${process.argv[2]}"`);
}
main().catch(exp =>
{
    console.log(exp.message);
    process.exit(-1);
});