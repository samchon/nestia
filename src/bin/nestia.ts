#!/usr/bin/env ts-node-script

import * as cli from "cli";
import * as fs from "fs";
import * as path from "path";

import { Terminal } from "../utils/Terminal";

import { NestiaApplication } from "../NestiaApplication";

interface ICommand
{
    install: boolean;
    out: string | null;
}

async function sdk(inputList: string[], command: ICommand): Promise<void>
{

    // VALIDATE OUTPUT
    if (command.out === null)
        throw new Error(`Output directory is not specified. Add the "--out <output_directory>" option.`);

    const parentPath: string = path.resolve(command.out + "/..");
    const parentStats: fs.Stats = await fs.promises.stat(parentPath);
    if (parentStats.isDirectory() === false)
        throw new Error(`Unable to find parent directory of the output path: "${parentPath}".`);

    // VALIDATE INPUTS
    for (const input of inputList)
    {
        const inputStats: fs.Stats = await fs.promises.stat(input);
        if (inputStats.isDirectory() === false)
            throw new Error(`Target "${inputList}" is not a directory.`);
    }

    //----
    // GENERATE
    //----
    // CALL THE APP.SDK()
    const app: NestiaApplication = new NestiaApplication(inputList, command.out);
    await app.sdk();
}

async function install(): Promise<void>
{
    for (const module of ["@types/node", "node-fetch"])
    {
        console.log(`installing ${module}...`);
        await Terminal.execute(`npm install --save-dev ${module}`);
    }
}

async function main(): Promise<void>
{
    if (process.argv[2] === "install")
        await install();
    else if (process.argv[2] === "sdk")
    {
        const command: ICommand = cli.parse({
            out: ["o", "Output path of the SDK files", "string", null],
            install: ["i", "Install Dependencies", "boolean", false]
        });

        try
        {
            const inputs: string[] = [];
            for (const arg of process.argv.slice(3))
                if (arg[0] !== "-")
                    inputs.push(arg);
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