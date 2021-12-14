#!/usr/bin/env ts-node-script

import cli from "cli";
import fs from "fs";
import path from "path";
import tsc from "typescript";

import { NestiaApplication } from "../NestiaApplication";

import { Terminal } from "../utils/Terminal";
import { stripJsonComments } from "../utils/stripJsonComments";

interface ICommand
{
    out: string | null;
}

async function sdk(input: string[], command: ICommand): Promise<void>
{
    let compilerOptions: tsc.CompilerOptions | undefined = {};

    //----
    // NESTIA.CONFIG.TS
    //----
    if (fs.existsSync("nestia.config.ts") === true)
    {
        const config: NestiaApplication.IConfiguration = await import(path.resolve("nestia.config.ts"));
        compilerOptions = config.compilerOptions;
        input = config.input instanceof Array ? config.input : [config.input];
        command.out = config.output;
    }
    
    //----
    // VALIDATIONS
    //----
    // CHECK OUTPUT
    if (command.out === null)
        throw new Error(`Output directory is not specified. Add the "--out <output_directory>" option.`);

    // CHECK PARENT DIRECTORY
    const parentPath: string = path.resolve(command.out + "/..");
    const parentStats: fs.Stats = await fs.promises.stat(parentPath);

    if (parentStats.isDirectory() === false)
        throw new Error(`Unable to find parent directory of the output path: "${parentPath}".`);

    // CHECK INPUTS
    for (const path of input)
    {
        const inputStats: fs.Stats = await fs.promises.stat(path);
        if (inputStats.isDirectory() === false)
            throw new Error(`Target "${path}" is not a directory.`);
    }

    //----
    // GENERATION
    //----
    if (fs.existsSync("tsconfig.json") === true)
    {
        const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
        const options: tsc.CompilerOptions = JSON.parse(stripJsonComments(content)).compilerOptions;

        compilerOptions = compilerOptions
            ? { ...options, ...compilerOptions }
            : options;
    }

    // CHECK NESTIA.CONFIG.TS

    // CALL THE APP.GENERATE()
    const app: NestiaApplication = new NestiaApplication({
        output: command.out,
        input,
        compilerOptions,
    });
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