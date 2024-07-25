import fs from "fs";
import path from "path";
import { register } from "ts-node";
import { parse } from "tsconfck";
import ts from "typescript";
import typia from "typia";

import { INestiaConfig } from "../../INestiaConfig";

export namespace NestiaConfigLoader {
  export const compilerOptions = async (
    project: string,
  ): Promise<ts.ParsedCommandLine> => {
    const configFileName = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      project,
    );
    if (!configFileName) throw new Error(`unable to find "${project}" file.`);
    const { tsconfig } = await parse(configFileName);
    const configFileText = JSON.stringify(tsconfig);
    const { config } = ts.parseConfigFileTextToJson(
      configFileName,
      configFileText,
    );
    return ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(configFileName),
    );
  };

  export const config = async (
    file: string,
    rawCompilerOptions: Record<string, any>,
  ): Promise<INestiaConfig> => {
    if (fs.existsSync(path.resolve(file)) === false)
      throw new Error(`Unable to find "${file}" file.`);

    register({
      emit: false,
      compilerOptions: rawCompilerOptions,
      require: rawCompilerOptions.baseUrl
        ? ["tsconfig-paths/register"]
        : undefined,
    });

    const loaded: INestiaConfig & { default?: INestiaConfig } = await import(
      path.resolve(file)
    );
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
