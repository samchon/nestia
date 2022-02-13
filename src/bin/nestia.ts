#!/usr/bin/env ts-node-script

import cli from "cli";
import fs from "fs";
import path from "path";
import tsc from "typescript";

import { NestiaApplication } from "../NestiaApplication";

import { Terminal } from "../utils/Terminal";
import { stripJsonComments } from "../utils/stripJsonComments";
import { IConfiguration } from "../IConfiguration";

interface ICommand
{
    exclude: string | null;
    out: string | null;
}

async function sdk(include: string[], command: ICommand): Promise<void>
{
    // CONFIGURATION
    let config: IConfiguration;
    if (fs.existsSync("nestia.config.ts") === true)
        config = {
            ...await import(path.resolve("nestia.config.ts"))
        };
    else
    {
        if (command.out === null)
            throw new Error(`Output directory is not specified. Add the "--out <output_directory>" option.`);
        config = {
            input: {
                include,
                exclude: command.exclude
                    ? [command.exclude]
                    : undefined
            },
            output: command.out
        };
    }
    
    // VALIDATE OUTPUT DIRECTORY
    const parentPath: string = path.resolve(config.output + "/..");
    const parentStats: fs.Stats = await fs.promises.stat(parentPath);

    if (parentStats.isDirectory() === false)
        throw new Error(`Unable to find parent directory of the output path: "${parentPath}".`);

    // GENERATION
    if (fs.existsSync("tsconfig.json") === true)
    {
        const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
        const options: tsc.CompilerOptions = JSON.parse(stripJsonComments(content)).compilerOptions;

        config.compilerOptions = {
            ...options,
            ...(config.compilerOptions || {})
        };
    }

    // CALL THE APP.GENERATE()
    const app: NestiaApplication = new NestiaApplication(config);
    await app.generate();
}

async function install(): Promise<void>
{
    await Terminal.execute("npm install --save nestia-fetcher");
}

async function main(): Promise<void>
{
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
    {
        const command: ICommand = cli.parse({
            exclude: ["e", "Something to exclude", "string", null],
            out: ["o", "Output path of the SDK files", "string", null],
        });

        try
        {
            const inputs: string[] = [];
            for (const arg of process.argv.slice(3))
            {
                if (arg[0] === "-")
                    break;
                inputs.push(arg);
            }
            await sdk(inputs, command);
        }
        catch (exp)
        {
            console.log(exp);
            process.exit(-1);
        }
    }
    else
    {
        console.log(`nestia supports only two commands; install and sdk, however you typed ${process.argv[2]}`);
        process.exit(-1);
    }
}
main();