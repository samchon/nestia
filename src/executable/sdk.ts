import * as cli from "cli";
import * as fs from "fs";
import * as path from "path";
import * as tsc from "typescript";

import { IConfiguration } from "../IConfiguration";
import { NestiaApplication } from "../NestiaApplication";
import { stripJsonComments } from "../utils/stripJsonComments";
import { NestiaConfig } from "../internal/NestiaConfig";

interface ICommand
{
    exclude: string | null;
    out: string | null;
}

async function sdk(include: string[], command: ICommand): Promise<void>
{
    // CONFIGURATION
    let config: IConfiguration | null = await NestiaConfig.get();
    if (config === null)
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

async function main(): Promise<void>
{
    const command: ICommand = cli.parse({
        exclude: ["e", "Something to exclude", "string", null],
        out: ["o", "Output path of the SDK files", "string", null],
    });

    try
    {
        const inputs: string[] = [];
        for (const arg of process.argv.slice(2))
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
main();