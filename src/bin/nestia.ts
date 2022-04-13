#!/usr/bin/env ts-node

import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";

import { CompilerOptions } from "../internal/CompilerOptions";
import { stripJsonComments } from "../utils/stripJsonComments";

interface IConfig
{
    compilerOptions?: CompilerOptions;
}

function install(): void
{
    // INSTALL DEPENDENCIES
    for (const lib of ["nestia-fetcher", "typescript-is"])
    {
        const command: string = `npm install ${lib}`;
        cp.execSync(command, { stdio: "inherit" });
    }
}

function sdk(file: string): void
{
    // PREPARE COMMAND
    const parameters: string[] = [
        `npx ts-node -C ttypescript --project "${file}"`,
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
                "NODE_NO_WARNINGS": "1" 
            } 
        }
    );
}

function configure(config: IConfig): boolean
{
    if (!config.compilerOptions)
    {
        config.compilerOptions = CompilerOptions.DEFAULT;
        return true;
    }
    else
        return CompilerOptions.emend(config.compilerOptions);
}

async function tsconfig(task: (file: string) => void): Promise<void>
{
    //----
    // PREPARE ASSETS
    //----
    let prepare: null | (() => Promise<[string, () => Promise<void>]>) = null;

    // NO TSCONFIG.JSON?
    if (fs.existsSync("tsconfig.json") === false)
    {
        const config = { compilerOptions: CompilerOptions.DEFAULT };
        prepare = CompilerOptions.temporary(config);
    }
    else
    {
        // HAS TSCONFIG.JSON
        const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
        const config = JSON.parse(stripJsonComments(content));
        
        // NEED TO ADD TRANSFORM PLUGINS
        const changed: boolean = configure(config);
        if (changed === true)
            prepare = CompilerOptions.temporary(config);
    }

    //----
    // EXECUTION
    //----
    // CREATE TEMPORARY TSCONFIG
    const [file, erasure] = prepare ? await prepare() : ["tsconfig.json", null];

    // EXECUTE THE TASK
    let error: Error | null = null;
    try
    {
        task(file);
    }
    catch (exp)
    {
        error = exp as Error;
    }

    // REMOVE THE TEMPORARY TSCONFIG
    if (erasure)
        await erasure();

    // THROW ERROR IF EXISTS
    if (error)
        throw error;
}

async function main()
{
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
        await tsconfig(sdk);
    else
        throw new Error(`nestia supports only two commands; install and sdk, however you typed ${process.argv[2]}`);
}
main().catch(exp =>
{
    console.log(exp.message);
    process.exit(-1);
});