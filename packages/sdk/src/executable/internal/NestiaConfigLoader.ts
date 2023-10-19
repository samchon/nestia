import fs from "fs";
import path from "path";
import { register } from "ts-node";
import { parseNative } from "tsconfck";
import ts from "typescript";

import typia from "typia";

import { INestiaConfig } from "../../INestiaConfig";

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
            throw new Error(`unable to find "${project}" file.`);

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
        file: string,
        options: ts.CompilerOptions,
    ): Promise<INestiaConfig> => {
        if (fs.existsSync(path.resolve(file)) === false)
            throw new Error(`Unable to find "${file}" file.`);

        register({
            emit: false,
            compilerOptions: options,
            require: options.baseUrl ? ["tsconfig-paths/register"] : undefined,
        });

        const loaded: INestiaConfig & { default?: INestiaConfig } =
            await import(path.resolve(file));
        const config: INestiaConfig =
            typeof loaded?.default === "object" && loaded.default !== null
                ? loaded.default
                : loaded;

        try {
            return typia.assert(config);
        } catch (exp) {
            if (typia.is<typia.TypeGuardError>(exp))
                exp.message = `invalid "${file}" data.`;
            throw exp;
        }
    };
}
