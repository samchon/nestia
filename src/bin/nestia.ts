#!/usr/bin/env ts-node

import * as cp from "child_process";
import * as path from "path";
import * as process from "process";

import { TsConfig } from "../internal/TsConfig";

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
    // PREPARE TSCONFIG
    await TsConfig.fulfill();

    // CONSTRUCT COMMAND
    const parameters: string[] = [
        `npx ts-node`,
        `"${path.relative(process.cwd(), `${__dirname}/../executable/sdk`)}"`,
        ...process.argv.slice(3)
    ];
    const command: string = parameters.join(" ");

    // EXECUTE THE COMMAND, BUT IGNORE WARNINGS
    cp.execSync
    (
        command, 
        { 
            stdio: "inherit",
            env: { 
                ...process.env, 
                "TS_NODE_COMPILER": "ttypescript",
                "NODE_NO_WARNINGS": "1" 
            } 
        }
    );
}
async function main()
{
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
        await sdk();
    else
        throw new Error(`nestia supports only two commands; install and sdk, however you typed ${process.argv[2]}`);
}
main().catch(exp =>
{
    console.log(exp.message);
    process.exit(-1);
});