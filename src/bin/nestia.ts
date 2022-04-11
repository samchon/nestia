#!/usr/bin/env ts-node

import cp from "child_process";
import fs from "fs";
import tsc from "typescript";

import { stripJsonComments } from "../utils/stripJsonComments";

function install(): void
{
    const command: string = "npm install --save nestia-fetcher";
    cp.execSync(command, { stdio: "inherit" });
}

function sdk(alias: boolean): void
{
    const parameters: string[] = [
        alias ? "npx ts-node -r tsconfig-paths/register" : "npx ts-node",
        __dirname + "/../executable/sdk",
        ...process.argv.slice(3)
    ];
    const command: string = parameters.join(" ");
    cp.execSync(command, { stdio: "inherit" });
}

async function tsconfig(task: (alias: boolean) => void): Promise<void>
{
    // NO TSCONFIG.JSON?
    if (fs.existsSync("tsconfig.json") === false)
    {
        task(false);
        return;
    }

    const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
    const json: any = JSON.parse(stripJsonComments(content));
    const options: tsc.CompilerOptions = json.compilerOptions;

    // NO ALIAS PATHS
    if (!options.paths || !Object.entries(options.paths).length)
    {
        task(false);
        return;
    }

    let closer: null | (() => Promise<void>) = null;
    let error: Error | null = null;

    if (!options.baseUrl)
    {
        options.baseUrl = "./";
        await fs.promises.writeFile
        (
            "tsconfig.json", 
            JSON.stringify(json, null, 2),
            "utf8"
        );

        closer = () => fs.promises.writeFile
        (
            "tsconfig.json", 
            content, 
            "utf8"
        );
    }

    try
    {
        task(true);
    }
    catch (exp)
    {
        error = exp as Error;
    }

    if (closer)
        await closer();
    if (error)
        throw error;
}

async function main(): Promise<void>
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