import cli from "cli";
import path from "path";
import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";
import { parseNative } from "tsconfck";
import ts from "typescript";

import { INestiaConfig } from "../../INestiaConfig";
import { NestiaSdkApplication } from "../../NestiaSdkApplication";
import { NestiaSdkConfig } from "./NestiaSdkConfig";

interface ICommand {
    exclude: string | null;
    out: string | null;
    e2e: string | null;
}

interface IProps {
    assign: (config: INestiaConfig, output: string) => void;
    validate: (config: INestiaConfig) => boolean;
    location: (config: INestiaConfig) => string;
}

export namespace NestiaSdkCommand {
    export const sdk = (argv: string[]) =>
        main({
            assign: (config, output) => (config.output = output),
            validate: (config) => !!config.output,
            location: (config) => config.output!,
        })(argv)((app) => app.sdk());

    export const swagger = (argv: string[]) =>
        main({
            assign: (config, output) => {
                if (!config.swagger) config.swagger = { output };
                else config.swagger.output = output;
            },
            validate: (config) => !!config.swagger && !!config.swagger.output,
            location: (config) => config.swagger!.output!,
        })(argv)((app) => app.swagger());

    export const e2e = (argv: string[]) =>
        main({
            assign: (config, output) => (config.output = output),
            validate: (config) => !!config.output,
            location: (config) => config.output!,
        })(argv)((app) => app.sdk());

    const main =
        (props: IProps) =>
        (argv: string[]) =>
        async (task: (app: NestiaSdkApplication) => Promise<void>) => {
            const command: ICommand = cli.parse({
                exclude: ["e", "Something to exclude", "string", null],
                out: ["o", "Output path of the SDK files", "string", null],
                e2e: [
                    "e",
                    "Output path of e2e test function files",
                    "string",
                    null,
                ],
            });

            const inputs: string[] = [];
            for (const r of argv) {
                if (r[0] === "-") break;
                inputs.push(r);
            }
            await generate(props)(command)(inputs)(task);
        };

    const generate =
        (props: IProps) =>
        (command: ICommand) =>
        (include: string[]) =>
        async (task: (app: NestiaSdkApplication) => Promise<void>) => {
            // CONFIGURATION
            const config: INestiaConfig =
                (await get_nestia_config(props.validate)) ??
                parse_cli(props)(command)(include);

            const options = await get_typescript_options();
            config.compilerOptions = {
                ...options,
                ...(config.compilerOptions || {}),
            };

            // CALL THE APP.GENERATE()
            const app: NestiaSdkApplication = new NestiaSdkApplication(config);
            await task(app);
        };

    async function get_typescript_options(): Promise<ts.CompilerOptions | null> {
        const configFileName = ts.findConfigFile(
            process.cwd(),
            ts.sys.fileExists,
            "tsconfig.json",
        );
        if (!configFileName) return null;

        const { tsconfig } = await parseNative(configFileName);
        const configFileText = JSON.stringify(tsconfig);
        const { config } = ts.parseConfigFileTextToJson(
            configFileName,
            configFileText,
        );
        const configParseResult = ts.parseJsonConfigFileContent(
            config,
            ts.sys,
            path.dirname(configFileName),
        );

        const { moduleResolution, ...result } =
            configParseResult.raw.compilerOptions;
        return result;
    }

    async function get_nestia_config(
        validate: (config: INestiaConfig) => boolean,
    ): Promise<INestiaConfig | null> {
        const connector = new WorkerConnector(null, null, "process");
        await connector.connect(
            `${__dirname}/nestia.config.getter.${__filename.substr(-2)}`,
        );

        const driver = await connector.getDriver<typeof NestiaSdkConfig>();
        const config: INestiaConfig | null = await driver.get();
        await connector.close();

        if (config !== null && validate(config) === false)
            throw new Error(
                `Error on NestiaCommand.main(): output path is not specified in the "nestia.config.ts".`,
            );

        return config;
    }

    const parse_cli =
        (props: IProps) =>
        (command: ICommand) =>
        (include: string[]): INestiaConfig => {
            if (command.out === null)
                throw new Error(
                    `Error on NestiaCommand.main(): output directory is not specified. Add the "--out <output_directory>" option.`,
                );

            const config: INestiaConfig = {
                input: {
                    include,
                    exclude: command.exclude ? [command.exclude] : undefined,
                },
                e2e: command.e2e ?? undefined,
            };
            props.assign(config, command.out);
            return config;
        };
}
