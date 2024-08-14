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

  export const configurations = async (
    file: string,
    compilerOptions: Record<string, any>,
  ): Promise<INestiaConfig[]> => {
    if (fs.existsSync(path.resolve(file)) === false)
      throw new Error(`Unable to find "${file}" file.`);

    const plugins: any[] = [
      ...typia
        .assert<object[]>(compilerOptions.plugins ?? [])
        .filter(
          (x: any) =>
            x.transform !== "@nestia/core/lib/transform" &&
            x.transform !== "@nestia/sdk/lib/transform",
        ),
      { transform: "@nestia/core/lib/transform" },
      { transform: "@nestia/sdk/lib/transform" },
    ];
    register({
      emit: false,
      compilerOptions: {
        ...compilerOptions,
        plugins,
      },
      require: compilerOptions.baseUrl
        ? ["tsconfig-paths/register"]
        : undefined,
    });

    const loaded: (INestiaConfig | INestiaConfig[]) & {
      default?: INestiaConfig | INestiaConfig[];
    } = await import(path.resolve(file));
    const instance: INestiaConfig | INestiaConfig[] =
      typeof loaded?.default === "object" && loaded.default !== null
        ? loaded.default
        : loaded;
    const configurations: INestiaConfig[] = Array.isArray(instance)
      ? instance
      : [instance];

    try {
      return typia.assert(configurations);
    } catch (exp) {
      if (typia.is<typia.TypeGuardError>(exp))
        exp.message = `invalid "${file}" data.`;
      throw exp;
    }
  };
}
