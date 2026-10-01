import { doNotThrowTransformError } from "@nestia/core";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

import { INestiaConfig } from "../../INestiaConfig";
import { EmittedJavaScriptPatcher } from "../../utils/EmittedJavaScriptPatcher";
import { TemporaryDirectory } from "../../utils/TemporaryDirectory";
import { TsConfigReader } from "../../utils/TsConfigReader";
import { TtscExecutor } from "../../utils/TtscExecutor";

/**
 * Loads the TypeScript configuration of a project and its `nestia.config.ts`.
 *
 * @evidence contracts/common.md#principled-implementation The project file is found and merged with its `extends` chain, and the configuration is compiled through ttsc with the nestia plugin into a temporary directory, imported, and validated by type checks of the input, the scalar options and the swagger options; the swagger `info`, `servers`, `security` and `tags` values are passed on unchecked.
 * @evidence contracts/common.md#clear-and-simple-design Two public functions with private helpers for the temporary roots, the plugin list, and the validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only this process's unique materializations are removed on exit and handled termination signals; shared cache parents and other processes' children remain, and a compile error is reported with the compiler output.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/performance.md#efficient-algorithms Project inheritance delegates one per-read traversal to TsConfigReader; configuration loading compiles one wrapper project, patches emitted JavaScript once and validates each returned config.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Wrapper project directories are removed in finally after compilation. Emitted output remains owned by the temporary registry until generation cleanup or process termination; imported module loader entries live in that process. A CLI watch child ends after each generation, whereas direct callers retain loaded exports and have no module-unload guarantee.
 * @evidence contracts/portability.md#os-neutral-implementation Native project and materialization paths use path resolution/joining and Node fs/module resolution. The ttsc executor represents platform-specific executables at its process boundary; emitted ESM imports use pathToFileURL, and filename extensions preserve .mts/.cts module format.
 */
export namespace NestiaConfigLoader {
  /**
   * The compiler options of a project as the loader reads them: the raw
   * `compilerOptions` object.
   *
   * @evidence contracts/common.md#principled-implementation The record wraps the raw options so callers can read them without a compiler API.
   * @evidence contracts/common.md#clear-and-simple-design A one-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The compiler-options record represents parsed values and selects no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record coordinates no configuration loads or shared producers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record owns neither materialization cleanup nor compiler tasks.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The raw compiler option record performs no native path resolution or process launch; its loader owns those boundaries.
   */
  export interface ICompilerOptions {
    raw: {
      compilerOptions?: Record<string, any>;
    };
  }

  /**
   * Returns the merged compiler options of the project file, following its
   * `extends` chain.
   *
   * It throws when the file cannot be found.
   *
   * @evidence contracts/common.md#principled-implementation The file is searched upward from the working directory when the name is relative, and `TsConfigReader` merges the chain, so the options are those the compiler would use.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating the reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads what the compiler reads.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result and the error.
   * @evidence contracts/performance.md#efficient-algorithms Upward project search visits each ancestor directory once, and TsConfigReader shares repeated ancestors inside one read.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This operation owns only invocation-local values, with no retained cache, handle or background task.
   * @evidence contracts/portability.md#os-neutral-implementation Native project and materialization paths use path resolution/joining and Node fs/module resolution. The ttsc executor represents platform-specific executables at its process boundary; emitted ESM imports use pathToFileURL, and filename extensions preserve .mts/.cts module format.
   */
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

  /**
   * Returns the configurations exported by a `nestia.config.ts`, validated.
   *
   * The file is compiled through ttsc with the nestia plugin into a temporary
   * directory and imported; a missing file, a compile error, or an invalid
   * field is an error.
   *
   * @evidence contracts/common.md#principled-implementation The wrapper project extends the user's project with emit forced on and declarations off, the typia plugin disabled and the nestia one enabled, the emitted file is patched for `import.meta.url`, and the exported value is checked for its input, scalar options and swagger options, so a malformed one is rejected before generation, while the OpenAPI `info`, `servers`, `security` and `tags` values are not inspected here.
   * @evidence contracts/common.md#clear-and-simple-design One function over private helpers for compilation, extraction, and validation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared registry removes only owned children on exit and handled termination signals, and the checks follow the `INestiaConfig` contract.
   * @evidence contracts/common.md#meaningful-documentation The comment states the compile step and the errors.
   * @evidence contracts/performance.md#efficient-algorithms Each invocation compiles one wrapper project, traverses its emitted JavaScript once and validates each returned config and option field.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Wrapper project directories are removed in finally after compilation. Emitted output remains owned by the temporary registry until generation cleanup or process termination; imported module loader entries live in that process. A CLI watch child ends after each generation, whereas direct callers retain loaded exports and have no module-unload guarantee.
   * @evidence contracts/portability.md#os-neutral-implementation Native project and materialization paths use path resolution/joining and Node fs/module resolution. The ttsc executor represents platform-specific executables at its process boundary; emitted ESM imports use pathToFileURL, and filename extensions preserve .mts/.cts module format.
   */
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
    const wrapperRoot: string = TemporaryDirectory.create(
      materializedRoot(projectRoot),
      "tsconfig-",
    );
    const outputRoot: string = TemporaryDirectory.create(
      materializedRoot(projectRoot),
      "run-",
    );
    const wrapperFile: string = path.join(wrapperRoot, "tsconfig.json");
    const wrapperConfig = {
      extends: projectFile,
      compilerOptions: {
        noEmit: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        ...nodeAmbientCompilerOptions(projectRoot, props.compilerOptions),
        // The wrapper compiles the config file only to require() its JS; .d.ts
        // is never read, and tsgo's declaration emitter can nil-panic on a
        // config that calls into Nest. Force it off regardless of the project.
        declaration: false,
        declarationMap: false,
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
        env: sdkTransformEnv(),
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
      TemporaryDirectory.remove(wrapperRoot);
    }
    await EmittedJavaScriptPatcher.importMetaUrl(outputRoot);

    const configKey: string = emittedJavaScriptKey(projectRoot, configFile);
    const next: string = path.join(outputRoot, configKey);
    if (fs.existsSync(next) === false)
      throw new Error(
        `failed to materialize "${props.file}" through ttsc native transform.`,
      );
    return next;
  };

  const materializedRoot = (projectRoot: string): string =>
    path.join(projectRoot, "node_modules", ".nestia", "config-loader");

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

  const sdkTransformEnv = (): NodeJS.ProcessEnv =>
    process.env.NESTIA_SDK_TRANSFORM === undefined
      ? { NESTIA_SDK_TRANSFORM: "1" }
      : {};

  const materializePlugins = (input: unknown): MaterializePlugin[] => {
    const plugins: MaterializePlugin[] = Array.isArray(input)
      ? input
          .filter((p) => typeof p === "object" && p !== null)
          .map((p) => ({ ...(p as MaterializePlugin) }))
      : [];
    const typia: MaterializePlugin | undefined = plugins.find((p) =>
      isTransform(p, "typia"),
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

  const findConfigFile = (cwd: string, project: string): string | undefined => {
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
