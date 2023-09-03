import fs from "fs";
import path from "path";
import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";
import { register } from "ts-node";
import { parseNative } from "tsconfck";
import ts from "typescript";

import typia from "typia";

import { INestiaConfig } from "../../INestiaConfig";
import { NestiaProjectGetter } from "./NestiaProjectGetter";

export namespace NestiaConfigLoader {
    export const compilerOptions = async (
        project: string,
    ): Promise<ts.CompilerOptions> => {
        const configFileName = ts.findConfigFile(
            process.cwd(),
            ts.sys.fileExists,
            project,
        );
        if (!configFileName)
            throw new Error(`unable to find "tsconfig.json" file.`);

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
    };

    export const config = async (
        options: ts.CompilerOptions,
    ): Promise<INestiaConfig> => {
        if (fs.existsSync(path.resolve("nestia.config.ts")) === false)
            throw new Error(`unable to find "nestia.config.ts" file.`);

        register({
            emit: false,
            compilerOptions: options,
            require: options.baseUrl ? ["tsconfig-paths/register"] : undefined,
        });

        const loaded: INestiaConfig & { default?: INestiaConfig } =
            await import(path.resolve("nestia.config.ts"));
        const config: INestiaConfig =
            typeof loaded?.default === "object" && loaded.default !== null
                ? loaded.default
                : loaded;

        try {
            return typia.assert(config);
        } catch (exp) {
            if (typia.is<typia.TypeGuardError>(exp))
                exp.message = `invalid "nestia.config.ts" data.`;
            throw exp;
        }
    };

    export const project = async (): Promise<string> => {
        const connector = new WorkerConnector(null, null, "process");
        await connector.connect(
            `${__dirname}/nestia.project.getter.${__filename.substr(-2)}`,
        );

        const driver = await connector.getDriver<typeof NestiaProjectGetter>();
        const project: string = await driver.get();
        await connector.close();

        return project;
    };
}
