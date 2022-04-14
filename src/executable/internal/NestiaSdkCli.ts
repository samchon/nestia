import * as cli from "cli";
import * as fs from "fs";
import * as path from "path";
import * as tsc from "typescript";
import JSONC from "jsonc-simple-parser";
import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";

import { IConfiguration } from "../../IConfiguration";
import { NestiaApplication } from "../../NestiaApplication";
import { NestiaConfig } from "./NestiaConfig";

interface ICommand
{
    exclude: string | null;
    out: string | null;
}

export namespace NestiaSdkCli
{
    export async function main(elements: string[], pure: boolean = true): Promise<void>
    {
        if (pure === false)
            cli.setArgv([
                process.argv[0],
                process.argv[1],
                "nestia",
                ...elements
            ])
        const command: ICommand = cli.parse({
            exclude: ["e", "Something to exclude", "string", null],
            out: ["o", "Output path of the SDK files", "string", null],
        });

        const inputs: string[] = [];
        for (const arg of elements)
        {
            if (arg[0] === "-")
                break;
            inputs.push(arg);
        }
        await generate(inputs, command);
    }

    async function generate(include: string[], command: ICommand): Promise<void>
    {
        // CONFIGRATION FROM THE NESTIA.CONFIG.JSON AND CLI
        let config: IConfiguration | null = await get_nestia_config();
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

        // CONFIGURATION FROM THE TSCONFIG.JSON
        if (fs.existsSync("tsconfig.json") === true)
        {
            const content: string = await fs.promises.readFile("tsconfig.json", "utf8");
            const options: tsc.CompilerOptions = JSONC.parse(content).compilerOptions;

            config.compilerOptions = {
                ...options,
                ...(config.compilerOptions || {})
            };
        }

        // CALL THE APP.GENERATE()
        const app: NestiaApplication = new NestiaApplication(config);
        await app.generate();
    }

    async function get_nestia_config(): Promise<IConfiguration | null>
    {
        const connector = new WorkerConnector(null, null, "process");
        await connector.connect(`${__dirname}/nestia.config.getter.js`);

        const driver = await connector.getDriver<typeof NestiaConfig>();
        const config: IConfiguration | null = await driver.get();

        await connector.close();
        return config;
    }
}