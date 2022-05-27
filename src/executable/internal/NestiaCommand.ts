import cli from "cli";
import fs from "fs";
import ts from "typescript";
import JSONC from "jsonc-simple-parser";
import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";

import { IConfiguration } from "../../IConfiguration";
import { NestiaApplication } from "../../NestiaApplication";
import { NestiaConfig } from "./NestiaConfig";

interface ICommand {
    exclude: string | null;
    out: string | null;
}

interface IOutput {
    assign: (config: IConfiguration, output: string) => void;
    validate: (config: IConfiguration) => boolean;
    location: (config: IConfiguration) => string;
}

export namespace NestiaCommand {
    export function sdk(
        elements: string[],
        pure: boolean = true,
    ): Promise<void> {
        return main(
            (app) => app.sdk(),
            {
                assign: (config, output) => (config.output = output),
                validate: (config) => !!config.output,
                location: (config) => config.output!,
            },
            elements,
            pure,
        );
    }

    export function swagger(
        elements: string[],
        pure: boolean = true,
    ): Promise<void> {
        return main(
            (app) => app.swagger(),
            {
                assign: (config, output) => {
                    if (!config.swagger) config.swagger = { output };
                    else config.swagger.output = output;
                },
                validate: (config) =>
                    !!config.swagger && !!config.swagger.output,
                location: (config) => config.swagger!.output!,
            },
            elements,
            pure,
        );
    }

    async function main(
        task: (app: NestiaApplication) => Promise<void>,
        output: IOutput,
        elements: string[],
        pure: boolean,
    ): Promise<void> {
        if (pure === false)
            cli.setArgv([
                process.argv[0],
                process.argv[1],
                "nestia",
                ...elements,
            ]);
        const command: ICommand = cli.parse({
            exclude: ["e", "Something to exclude", "string", null],
            out: ["o", "Output path of the SDK files", "string", null],
        });

        const inputs: string[] = [];
        for (const arg of elements) {
            if (arg[0] === "-") break;
            inputs.push(arg);
        }
        await generate(task, inputs, command, output);
    }

    async function generate(
        task: (app: NestiaApplication) => Promise<void>,
        include: string[],
        command: ICommand,
        output: IOutput,
    ): Promise<void> {
        // CONFIGRATION
        const config: IConfiguration =
            (await get_nestia_config(output.validate)) ??
            parse_cli(include, command, output);

        // CONFIGURATION FROM THE TSCONFIG.JSON
        if (fs.existsSync("tsconfig.json") === true) {
            const content: string = await fs.promises.readFile(
                "tsconfig.json",
                "utf8",
            );
            const options: ts.CompilerOptions =
                JSONC.parse(content).compilerOptions;

            config.compilerOptions = {
                ...options,
                ...(config.compilerOptions || {}),
            };
        }

        // CALL THE APP.GENERATE()
        const app: NestiaApplication = new NestiaApplication(config);
        await task(app);
    }

    async function get_nestia_config(
        validate: (config: IConfiguration) => boolean,
    ): Promise<IConfiguration | null> {
        const connector = new WorkerConnector(null, null, "process");
        await connector.connect(`${__dirname}/nestia.config.getter.js`);

        const driver = await connector.getDriver<typeof NestiaConfig>();
        const config: IConfiguration | null = await driver.get();
        await connector.close();

        if (config !== null && validate(config) === false)
            throw new Error(
                `Error on NestiaCommand.main(): output path is not specified in the "nestia.config.ts".`,
            );

        return config;
    }

    function parse_cli(
        include: string[],
        command: ICommand,
        output: IOutput,
    ): IConfiguration {
        if (command.out === null)
            throw new Error(
                `Output directory is not specified. Add the "--out <output_directory>" option.`,
            );

        const config: IConfiguration = {
            input: {
                include,
                exclude: command.exclude ? [command.exclude] : undefined,
            },
        };
        output.assign(config, command.out);
        return config;
    }
}
