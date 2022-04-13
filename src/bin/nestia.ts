#!/usr/bin/env ts-node

import * as cp from "child_process";
import * as fs from "fs";

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

function sdk(): void
{
    // PREPARE COMMAND
    const parameters: string[] = [
        "npx ts-node -C ttypescript",
        `"${__dirname}/../executable/sdk"`,
        ...process.argv.slice(3)
    ];
    const command: string = parameters.join(" ");

    // EXECUTE THE COMMAND, BUT IGNORE WARNINGS
    cp.execSync
    (
        command, 
        { 
            stdio: "inherit",
            env: { "NODE_NO_WARNINGS": "1" } 
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

async function tsconfig(task: () => void): Promise<void>
{
    //----
    // PREPARE ASSETS
    //----
    let prepare: null | (() => Promise<void>) = null;
    let restore: null | (() => Promise<void>) = null;

    if (fs.existsSync("tsconfig.json") === false)
    {
        // NO TSCONFIG.JSON
        const config: IConfig = {
            compilerOptions: CompilerOptions.DEFAULT
        };
        prepare = () => fs.promises.writeFile
        (
            "tsconfig.json",
            JSON.stringify(config, null, 2),
            "utf8"
        );
        restore = () => fs.promises.unlink("tsconfig.json")
    }
    else
    {
        // HAS TSCONFIG.JSON
        const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
        const config: IConfig = JSON.parse(stripJsonComments(content));
        const changed: boolean = configure(config);

        if (changed === true)
        {
            // NEED TO ADD TRANSFORM PLUGINS
            prepare = () => fs.promises.writeFile
            (
                "tsconfig.json", 
                JSON.stringify(config, null, 2),
                "utf8"
            );
            restore = () => fs.promises.writeFile("tsconfig.json", content, "utf8");
        }
    }

    //----
    // EXECUTION
    //----
    // PREPARE SOMETHING
    if (prepare !== null)
        await prepare();

    // EXECUTE THE TASK
    let error: Error | null = null;
    try
    {
        task();
    }
    catch (exp)
    {
        error = exp as Error;
    }

    // RESTORE THE TSCONFIG.JSON
    if (restore !== null)
        await restore();

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