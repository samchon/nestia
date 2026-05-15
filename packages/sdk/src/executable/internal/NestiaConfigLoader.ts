import { doNotThrowTransformError } from "@nestia/core";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import { INestiaConfig } from "../../INestiaConfig";
import { TsConfigReader } from "../../utils/TsConfigReader";
import { TtscExecutor } from "../../utils/TtscExecutor";

export namespace NestiaConfigLoader {
  export interface ICompilerOptions {
    raw: {
      compilerOptions?: Record<string, any>;
    };
  }

  export const compilerOptions = async (
    project: string,
  ): Promise<ICompilerOptions> => {
    const configFileName = findConfigFile(process.cwd(), project);
    if (!configFileName) throw new Error(`unable to find "${project}" file.`);
    const tsconfig = await TsConfigReader.read(configFileName);
    return {
      raw: {
        compilerOptions:
          typeof tsconfig?.compilerOptions === "object"
            ? (tsconfig.compilerOptions as Record<string, any>)
            : {},
      },
    };
  };

  export const configurations = async (
    file: string,
    compilerOptions: Record<string, any>,
  ): Promise<INestiaConfig[]> => {
    if (fs.existsSync(path.resolve(file)) === false)
      throw new Error(`Unable to find "${file}" file.`);

    doNotThrowTransformError(false);

    if (compilerOptions.plugins !== undefined)
      assertPlugins(file, compilerOptions.plugins);

    const configFile: string = await materializeConfiguration({
      file,
      compilerOptions,
    });
    const loaded: unknown = await loadMaterializedModule(configFile);
    const instance: INestiaConfig | INestiaConfig[] = extractConfiguration(
      file,
      loaded,
    );
    const configurations: INestiaConfig[] = Array.isArray(instance)
      ? instance
      : [instance];

    return assertConfigurations(file, configurations);
  };

  const MATERIALIZED_ROOTS: Set<string> = new Set();
  let CLEANUP_REGISTERED: boolean = false;

  const materializeConfiguration = async (props: {
    file: string;
    compilerOptions: Record<string, any>;
  }): Promise<string> => {
    const configFile: string = path.resolve(props.file);
    const project: string = process.env.NESTIA_PROJECT ?? "tsconfig.json";
    const projectFile: string | undefined = findConfigFile(
      process.cwd(),
      project,
    );
    if (projectFile === undefined)
      throw new Error(`unable to find "${project}" file.`);

    const projectRoot: string = path.dirname(path.resolve(projectFile));
    const wrapperRoot: string = fs.mkdtempSync(
      path.join(ensureMaterializedRoot(projectRoot), "tsconfig-"),
    );
    const outputRoot: string = fs.mkdtempSync(
      path.join(ensureMaterializedRoot(projectRoot), "run-"),
    );
    const wrapperFile: string = path.join(wrapperRoot, "tsconfig.json");
    const wrapperConfig = {
      extends: projectFile,
      compilerOptions: {
        noEmit: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        ...nodeAmbientCompilerOptions(projectRoot, props.compilerOptions),
        outDir: outputRoot,
        plugins: materializePlugins(props.compilerOptions.plugins),
        rootDir: projectRoot,
      },
      include: [configFile],
      exclude: [path.join(projectRoot, "src", "test", "**", "*")],
    };
    fs.writeFileSync(
      wrapperFile,
      JSON.stringify(wrapperConfig, null, 2),
      "utf8",
    );

    try {
      TtscExecutor.run({
        cwd: projectRoot,
        project: wrapperFile,
      });
    } catch (error) {
      const stderr: string = readChildOutput(error, "stderr");
      const stdout: string = readChildOutput(error, "stdout");
      const detail: string = stderr || stdout;
      const cause: Error =
        error instanceof Error ? error : new Error(String(error));
      const status: number | string | undefined =
        (cause as { status?: number }).status ??
        (cause as NodeJS.ErrnoException).code;
      throw new Error(
        detail
          ? `failed to compile "${props.file}" through ttsc:\n${detail}`
          : `failed to compile "${props.file}" through ttsc (exit code ${status ?? "unknown"}). Run \`npx ttsc -p ${projectFile}\` to see the underlying diagnostics.`,
        { cause },
      );
    } finally {
      fs.rmSync(wrapperRoot, { force: true, recursive: true });
    }

    const configKey: string = emittedJavaScriptKey(projectRoot, configFile);
    const next: string = path.join(outputRoot, configKey);
    if (fs.existsSync(next) === false)
      throw new Error(
        `failed to materialize "${props.file}" through ttsc native transform.`,
      );
    return next;
  };

  const ensureMaterializedRoot = (projectRoot: string): string => {
    const root: string = path.join(
      projectRoot,
      "node_modules",
      ".nestia",
      "config-loader",
    );
    fs.mkdirSync(root, { recursive: true });
    MATERIALIZED_ROOTS.add(root);
    if (CLEANUP_REGISTERED === false) {
      CLEANUP_REGISTERED = true;
      process.once("exit", () => {
        for (const location of MATERIALIZED_ROOTS)
          fs.rmSync(location, { force: true, recursive: true });
      });
    }
    return root;
  };

  const emittedJavaScriptKey = (projectRoot: string, file: string): string => {
    const relative: string = path.relative(projectRoot, file);
    const extension: string = path.extname(relative).toLowerCase();
    const emitted: string =
      extension === ".mts" ? ".mjs" : extension === ".cts" ? ".cjs" : ".js";
    return path
      .join(
        path.dirname(relative),
        `${path.basename(relative, extension)}${emitted}`,
      )
      .split(path.sep)
      .join(path.posix.sep);
  };

  const nodeAmbientCompilerOptions = (
    projectRoot: string,
    compilerOptions: Record<string, any>,
  ): { typeRoots?: string[]; types: string[] } => {
    const typeRoots: string[] = uniqueStrings([
      ...asStringArray(compilerOptions.typeRoots),
      ...resolveNodeTypeRoots(projectRoot),
    ]);
    const types: string[] = uniqueStrings([
      "node",
      ...asStringArray(compilerOptions.types).filter((value) => value !== "*"),
    ]);
    return {
      ...(typeRoots.length !== 0 ? { typeRoots } : {}),
      types,
    };
  };

  const resolveNodeTypeRoots = (projectRoot: string): string[] => {
    const roots: string[] = [];
    for (const base of [projectRoot, process.cwd(), __dirname])
      try {
        const location: string = require.resolve("@types/node/package.json", {
          paths: [base],
        });
        roots.push(path.dirname(path.dirname(location)));
      } catch {
        continue;
      }
    return roots;
  };

  const asStringArray = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((elem): elem is string => typeof elem === "string")
      : [];

  const uniqueStrings = (input: string[]): string[] => [...new Set(input)];

  type MaterializePlugin = Record<string, unknown> & { transform?: unknown };

  const materializePlugins = (input: unknown): MaterializePlugin[] => {
    const plugins: MaterializePlugin[] = Array.isArray(input)
      ? input
          .filter((p) => typeof p === "object" && p !== null)
          .map((p) => ({ ...(p as MaterializePlugin) }))
      : [];
    const typia: MaterializePlugin | undefined = plugins.find((p) =>
      isTransform(p, "typia"),
    );
    const sdk: MaterializePlugin | undefined = plugins.find((p) =>
      isTransform(p, "@nestia/sdk"),
    );
    const core: MaterializePlugin | undefined = plugins.find((p) =>
      isTransform(p, "@nestia/core"),
    );
    return [
      {
        ...(typia ?? {}),
        transform: "typia/lib/transform",
        enabled: false,
      },
      normalizePlugin({
        ...(sdk ?? {}),
        transform: "@nestia/sdk/lib/transform",
      }),
      normalizePlugin({
        ...(core ?? {}),
        transform: "@nestia/core/native/transform.cjs",
      }),
    ];
  };

  const normalizePlugin = (plugin: MaterializePlugin): MaterializePlugin => {
    const output: MaterializePlugin = { ...plugin };
    if (output.enabled === false) delete output.enabled;
    return output;
  };

  const isTransform = (plugin: MaterializePlugin, name: string): boolean =>
    typeof plugin.transform === "string" && plugin.transform.includes(name);

  const findConfigFile = (
    cwd: string,
    project: string,
  ): string | undefined => {
    const candidate: string = path.isAbsolute(project)
      ? project
      : path.resolve(cwd, project);
    if (fs.existsSync(candidate)) return candidate;
    if (path.isAbsolute(project) || project.includes(path.sep))
      return undefined;

    let current: string = path.resolve(cwd);
    while (true) {
      const next: string = path.join(current, project);
      if (fs.existsSync(next)) return next;
      const parent: string = path.dirname(current);
      if (parent === current) return undefined;
      current = parent;
    }
  };

  const extractConfiguration = (
    file: string,
    loaded: unknown,
  ): INestiaConfig | INestiaConfig[] => {
    const candidates: unknown[] = [];
    const collect = (value: unknown): void => {
      if (isObject(value)) {
        candidates.push(value.default);
        candidates.push(value.NESTIA_CONFIG);
        if (isObject(value.default)) {
          candidates.push(value.default.default);
          candidates.push(value.default.NESTIA_CONFIG);
        }
      }
      candidates.push(value);
    };
    collect(loaded);
    const matched: unknown = candidates.find(
      (value) =>
        Array.isArray(value) ||
        (isObject(value) && Object.hasOwn(value, "input")),
    );
    if (matched === undefined)
      throw new Error(
        `invalid "${file}" data: configuration must be exported.`,
      );
    return matched as INestiaConfig | INestiaConfig[];
  };

  const loadMaterializedModule = async (file: string): Promise<unknown> => {
    if (file.endsWith(".mjs")) {
      const dynamicImport = new Function(
        "specifier",
        "return import(specifier)",
      ) as (specifier: string) => Promise<unknown>;
      return dynamicImport(pathToFileURL(file).href);
    }
    return require(file);
  };

  const assertPlugins = (
    file: string,
    input: unknown,
  ): Array<Record<string, any>> => {
    if (
      Array.isArray(input) &&
      input.every((elem) => typeof elem === "object" && elem !== null)
    )
      return input as Array<Record<string, any>>;
    throw new Error(
      `invalid "${file}" data: compilerOptions.plugins must be an array.`,
    );
  };

  const assertConfigurations = (
    file: string,
    input: unknown[],
  ): INestiaConfig[] => {
    input.forEach((config, index) => assertConfig(file, config, index));
    return input as INestiaConfig[];
  };

  const assertConfig = (file: string, input: unknown, index: number): void => {
    if (isObject(input) === false)
      throw new Error(
        `invalid "${file}" data: configuration #${index} must be an object.`,
      );
    const config: INestiaConfig = input as unknown as INestiaConfig;
    if (isInput(config.input) === false)
      throw new Error(
        `invalid "${file}" data: configuration #${index}.input is invalid.`,
      );
    for (const [key, value] of [
      ["output", config.output],
      ["distribute", config.distribute],
      ["e2e", config.e2e],
    ] as const)
      if (value !== undefined && typeof value !== "string")
        throw new Error(
          `invalid "${file}" data: configuration #${index}.${key} must be a string.`,
        );
    for (const [key, value] of [
      ["keyword", config.keyword],
      ["simulate", config.simulate],
      ["propagate", config.propagate],
      ["clone", config.clone],
      ["primitive", config.primitive],
      ["assert", config.assert],
      ["json", config.json],
    ] as const)
      if (value !== undefined && typeof value !== "boolean")
        throw new Error(
          `invalid "${file}" data: configuration #${index}.${key} must be a boolean.`,
        );
    if (config.swagger !== undefined && isSwagger(config.swagger) === false)
      throw new Error(
        `invalid "${file}" data: configuration #${index}.swagger is invalid.`,
      );
  };

  const isInput = (input: unknown): input is INestiaConfig["input"] => {
    if (
      typeof input === "string" ||
      typeof input === "function" ||
      isStringArray(input)
    )
      return true;
    if (isObject(input) === false) return false;
    return (
      isStringArray(input.include) &&
      (input.exclude === undefined || isStringArray(input.exclude))
    );
  };

  const isSwagger = (input: unknown): input is INestiaConfig.ISwaggerConfig => {
    if (isObject(input) === false) return false;
    return (
      typeof input.output === "string" &&
      (input.openapi === undefined ||
        ["2.0", "3.0", "3.1", "3.2"].includes(input.openapi as string)) &&
      (input.beautify === undefined ||
        typeof input.beautify === "boolean" ||
        typeof input.beautify === "number") &&
      (input.additional === undefined ||
        typeof input.additional === "boolean") &&
      (input.decompose === undefined || typeof input.decompose === "boolean") &&
      (input.operationId === undefined ||
        typeof input.operationId === "function")
    );
  };

  const isObject = (input: unknown): input is Record<string, unknown> =>
    typeof input === "object" &&
    input !== null &&
    Array.isArray(input) === false;

  const isStringArray = (input: unknown): input is string[] =>
    Array.isArray(input) && input.every((elem) => typeof elem === "string");

  const readChildOutput = (
    error: unknown,
    key: "stderr" | "stdout",
  ): string => {
    if (!error || typeof error !== "object" || !(key in error)) return "";
    const value = (error as Record<string, unknown>)[key];
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (Buffer.isBuffer(value)) return value.toString("utf8").trim();
    return "";
  };
}
