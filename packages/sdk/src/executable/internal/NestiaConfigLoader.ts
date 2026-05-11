import { doNotThrowTransformError } from "@nestia/core";
import fs from "fs";
import os from "os";
import path from "path";
import { parse } from "tsconfck";
import ts from "typescript";
import { pathToFileURL } from "url";

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
    const projectFile: string | undefined = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      project,
    );
    if (projectFile === undefined)
      throw new Error(`unable to find "${project}" file.`);

    const projectRoot: string = path.dirname(path.resolve(projectFile));
    const wrapperRoot: string = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-config-tsconfig-"),
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
        rootDir: projectRoot,
      },
      include: [configFile],
      exclude: [path.join(projectRoot, "src", "test", "**", "*")],
    };
    fs.writeFileSync(wrapperFile, JSON.stringify(wrapperConfig, null, 2), "utf8");

    const result = emitConfiguration(wrapperFile);
    fs.rmSync(wrapperRoot, { force: true, recursive: true });
    if (result.length !== 0)
      throw new Error(formatCompilerFailure(props.file, result));

    const configKey: string = emittedJavaScriptKey(projectRoot, configFile);
    const next: string = path.join(outputRoot, configKey);
    if (fs.existsSync(next) === false)
      throw new Error(
        `failed to materialize "${props.file}" through ttsc native transform.`,
      );
    return next;
  };

  const emitConfiguration = (wrapperFile: string): ts.Diagnostic[] => {
    const configDiagnostics: ts.Diagnostic[] = [];
    const parsed: ts.ParsedCommandLine | undefined =
      ts.getParsedCommandLineOfConfigFile(
        wrapperFile,
        {},
        {
          ...ts.sys,
          onUnRecoverableConfigFileDiagnostic: (diagnostic) =>
            configDiagnostics.push(diagnostic),
        },
      );
    if (parsed === undefined) return configDiagnostics;

    const program: ts.Program = ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options,
      projectReferences: parsed.projectReferences,
    });
    const emitted: ts.EmitResult = program.emit();
    return [
      ...configDiagnostics,
      ...ts.getPreEmitDiagnostics(program),
      ...emitted.diagnostics,
    ].filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
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
  ): Pick<ts.CompilerOptions, "typeRoots" | "types"> => {
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

  const formatCompilerFailure = (
    file: string,
    diagnostics: ts.Diagnostic[],
  ): string => {
    return [
      `failed to compile "${file}" through TypeScript compiler.`,
      ...diagnostics.map(formatDiagnostic),
    ].join("\n");
  };

  const formatDiagnostic = (diag: ts.Diagnostic): string => {
    const location = diag.file
      ? (() => {
          const position = diag.file!.getLineAndCharacterOfPosition(
            diag.start ?? 0,
          );
          return `${diag.file!.fileName} - ${position.line + 1}:${position.character + 1}`;
        })()
      : "<global>";
    return [
      location,
      `TS${diag.code}`,
      ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
    ].join(" - ");
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
}
