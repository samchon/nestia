/// <reference path="../typings/get-function-location.d.ts" />
import { INestApplication, VersioningType } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants";
import { NestContainer } from "@nestjs/core";
import { Module } from "@nestjs/core/injector/module";
import fs from "fs";
import getFunctionLocation from "get-function-location";
import path from "path";
import { HashMap } from "tstl";
import { pathToFileURL } from "url";

import { INestiaConfig } from "../INestiaConfig";
import { INestiaSdkInput } from "../structures/INestiaSdkInput";
import { EmittedJavaScriptPatcher } from "../utils/EmittedJavaScriptPatcher";
import { MapUtil } from "../utils/MapUtil";
import { PathUtil } from "../utils/PathUtil";
import { SdkInputFilter } from "../utils/SdkInputFilter";
import { SourceFinder } from "../utils/SourceFinder";
import { TemporaryDirectory } from "../utils/TemporaryDirectory";
import { TsConfigReader } from "../utils/TsConfigReader";
import { TtscExecutor } from "../utils/TtscExecutor";

/**
 * Finds the controllers a configuration names, either by compiling and
 * importing sources or by reading a running application.
 *
 * @evidence contracts/common.md#principled-implementation Sources are compiled once through ttsc into a temporary directory, imported, and the exports that carry the Nest `path` metadata are the controllers; an application is read from its module container; results are memoized per configuration object in a weakly keyed map, so a configuration the watcher reloads releases its entry with the object.
 * @evidence contracts/common.md#clear-and-simple-design Two public functions and a private runtime compiler; the output-specific bundle filter comes from SdkInputFilter and configuration/runtime materializations share the owned-child cleanup registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generated SDK's own files are excluded from the input by the bundle list of the SDK, not by name, and the container is read through internals, as noted at `application`.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/performance.md#efficient-algorithms Discovery traverses candidate files once, compiles one runtime project and inspects every exported value; work scales with source/compiler input and export population. Application input instead traverses container controllers and resolves each unique class location.
 * @evidence contracts/performance.md#reuse-equivalent-work The promise cache shares concurrent and completed analyses for the same config object. It assumes that object, its input sources and application state remain unchanged during its lifetime; callers must supply a fresh config object after changes. Bundle exclusion shares only installed asset descriptions and derives native/realpath roots separately for each output; distinct outputs never reuse one captured prefix.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The weakly keyed input map does not retain released config objects, but emitted directories are registered until owned generation cleanup or process exit. Imported CommonJS/ESM modules remain in the hosting Node loader; direct programmatic callers have no per-generation unload guarantee. CLI watch generations isolate this state in a short-lived child.
 * @evidence contracts/portability.md#os-neutral-implementation Source/controller identity is obtained from Node path/file-URL conversion, module resolution and native fs. Compiler projects use explicit cwd and native paths; emitted module imports use file URLs. Route prefix/version spelling is kept as protocol text, not treated as filesystem identity.
 */
export namespace ConfigAnalyzer {
  /**
   * Returns the analyzed input of a configuration: the controllers with their
   * files and the global prefix and versioning options.
   *
   * The result is cached per configuration object.
   *
   * @evidence contracts/common.md#principled-implementation A function input is asked for the application and read as a running app; otherwise the matched TypeScript sources are compiled and imported, and the memo stores the promise so concurrent callers share one compilation.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating to `application` or to the runtime compiler.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The cache is keyed by the identity of the configuration object, so a different or reloaded configuration object is never served another's result; one object keeps its first result, which is the contract of a configuration that is not mutated between generations.
   * @evidence contracts/common.md#meaningful-documentation The comment states the two input forms and the caching.
   * @evidence contracts/performance.md#efficient-algorithms Discovery traverses candidate files once, compiles one runtime project and inspects every exported value; work scales with source/compiler input and export population. Application input instead traverses container controllers and resolves each unique class location.
   * @evidence contracts/performance.md#reuse-equivalent-work The promise cache shares concurrent and completed analyses for the same config object. It assumes that object, its input sources and application state remain unchanged during its lifetime; callers must supply a fresh config object after changes. Bundle exclusion shares only installed asset descriptions and derives native/realpath roots separately for each output; distinct outputs never reuse one captured prefix.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The weakly keyed input map does not retain released config objects, but emitted directories are registered until owned generation cleanup or process exit. Imported CommonJS/ESM modules remain in the hosting Node loader; direct programmatic callers have no per-generation unload guarantee. CLI watch generations isolate this state in a short-lived child.
   * @evidence contracts/portability.md#os-neutral-implementation Source/controller identity is obtained from Node path/file-URL conversion, module resolution and native fs. Compiler projects use explicit cwd and native paths; emitted module imports use file URLs. Route prefix/version spelling is kept as protocol text, not treated as filesystem identity.
   */
  export const input = async (
    config: INestiaConfig,
  ): Promise<INestiaSdkInput> => {
    return MapUtil.take(memory, config, async () => {
      if (typeof config.input === "function")
        return application(await config.input());

      const sources: string[] = await SourceFinder.find({
        include: Array.isArray(config.input)
          ? config.input
          : typeof config.input === "object"
            ? config.input.include
            : [config.input],
        exclude:
          typeof config.input === "object" && !Array.isArray(config.input)
            ? (config.input.exclude ?? [])
            : [],
        filter: await SdkInputFilter.create(config.output),
      });
      const runtime: RuntimeCompiler = await RuntimeCompiler.compile(sources);
      const controllers: INestiaSdkInput.IController[] = [];
      for (const file of sources) {
        const external: Record<string, unknown> = await dynamicImport(
          pathToFileURL(runtime.output(file)).href,
        );
        for (const key in external) {
          const instance: unknown = external[key];
          if (typeof instance !== "function") continue;
          if (Reflect.getMetadata("path", instance) !== undefined)
            controllers.push({
              class: instance,
              location: file,
              prefixes: [],
            });
        }
      }
      return {
        controllers,
      };
    });
  };

  /**
   * Reads the controllers, the global prefix, and the versioning options of a
   * running NestJS application.
   *
   * @evidence contracts/common.md#principled-implementation The controllers come from the module container with their module paths, their files from the location of each class, decoded from the `file:` URL, and the prefix and versioning options from the application's configuration.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts NestJS exposes no public accessor for the container or the configuration, so the function reads `app.container` and `app.config`; this is the one foreign-internal read of the package and stays a stated limit.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is read.
   * @evidence contracts/performance.md#efficient-algorithms The container is traversed once and a hash map groups each class with its module prefixes, so location lookup occurs once per unique controller class.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This invocation computes its own result and coordinates no completed or in-flight computation across requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation retains local module/controller collections until it returns. The running application and its controllers remain caller-owned; this reader neither starts nor closes the app.
   * @evidence contracts/portability.md#os-neutral-implementation Source/controller identity is obtained from Node path/file-URL conversion, module resolution and native fs. Compiler projects use explicit cwd and native paths; emitted module imports use file URLs. Route prefix/version spelling is kept as protocol text, not treated as filesystem identity.
   */
  export const application = async (
    app: INestApplication,
  ): Promise<INestiaSdkInput> => {
    const container: NestContainer = (app as any).container as NestContainer;
    const modules: Module[] = [...container.getModules().values()].filter(
      (m) => !!m.controllers.size,
    );
    const unique: HashMap<Function, Set<string>> = new HashMap();

    for (const m of modules) {
      const path: string =
        Reflect.getMetadata(
          MODULE_PATH + container.getModules().applicationId,
          m.metatype,
        ) ??
        Reflect.getMetadata(MODULE_PATH, m.metatype) ??
        "";
      for (const controller of [...m.controllers.keys()])
        if (typeof controller === "function")
          unique.take(controller, () => new Set()).add(path);
    }
    const controllers: INestiaSdkInput.IController[] = [];
    for (const it of unique) {
      const file: string | null =
        (await getFunctionLocation(it.first))?.source ?? null;
      if (file === null) continue;
      const location: string = PathUtil.location(file);
      if (location.length === 0) continue;
      controllers.push({
        class: it.first,
        prefixes: Array.from(it.second),
        location,
      });
    }

    const versioning = (app as any).config?.versioningOptions;
    return {
      controllers,
      globalPrefix:
        typeof (app as any).config?.globalPrefix === "string"
          ? {
              prefix: (app as any).config.globalPrefix,
              exclude: (app as any).config.globalPrefixOptions?.exclude ?? [],
            }
          : undefined,
      versioning:
        versioning === undefined || versioning.type !== VersioningType.URI
          ? undefined
          : {
              // as NestJS's RoutePathFactory.getVersionPrefix(): `false` is no
              // prefix at all, and only an absent one is the default "v"
              prefix:
                versioning.prefix === false ? "" : (versioning.prefix ?? "v"),
              defaultVersion: versioning.defaultVersion,
            },
    };
  };
}
const memory = new WeakMap<INestiaConfig, Promise<INestiaSdkInput>>();
class RuntimeCompiler {
  private constructor(
    private readonly cwd: string,
    private readonly outDir: string,
  ) {}

  public static async compile(sources: string[]): Promise<RuntimeCompiler> {
    const cwd: string = process.cwd();
    const runtimeRoot: string = path.join(
      cwd,
      "node_modules",
      ".nestia",
      "runtime",
    );
    const outDir: string = TemporaryDirectory.create(runtimeRoot, "run-");
    const project: string = path.join(
      cwd,
      `.nestia.runtime.${process.pid}.${Date.now()}.json`,
    );
    const relative = (file: string): string =>
      path.relative(cwd, file).split("\\").join("/");
    await fs.promises.writeFile(
      project,
      JSON.stringify(
        {
          extends: normalizeProjectPath(process.env.NESTIA_PROJECT),
          compilerOptions: {
            noEmit: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            outDir,
            plugins: await runtimePlugins(cwd),
            rootDir: ".",
          },
          include: sources.map(relative),
        },
        null,
        2,
      ),
      "utf8",
    );
    try {
      TtscExecutor.run({
        cwd,
        env: sdkTransformEnv(),
        project,
      });
    } catch (error) {
      const output =
        error instanceof Error && "stderr" in error
          ? String((error as Error & { stderr?: Buffer }).stderr ?? "")
          : "";
      throw new Error(output || `Failed to compile Nestia runtime inputs.`);
    } finally {
      await fs.promises.rm(project, { force: true });
    }
    await EmittedJavaScriptPatcher.importMetaUrl(outDir);
    return new RuntimeCompiler(cwd, outDir);
  }

  public output(source: string): string {
    const relative: string = path.relative(this.cwd, source);
    const emitted: string = path.join(
      this.outDir,
      replaceExtension(relative, ".js"),
    );
    return emitted;
  }
}

type RuntimePlugin = Record<string, unknown> & { transform?: unknown };

const sdkTransformEnv = (): NodeJS.ProcessEnv =>
  process.env.NESTIA_SDK_TRANSFORM === undefined
    ? { NESTIA_SDK_TRANSFORM: "1" }
    : {};

const runtimePlugins = async (cwd: string): Promise<RuntimePlugin[]> => {
  const plugins: RuntimePlugin[] = await readProjectPlugins(cwd);
  const typia: RuntimePlugin | undefined = plugins.find((p) =>
    isTransform(p, "typia"),
  );
  const core: RuntimePlugin | undefined = plugins.find((p) =>
    isTransform(p, "@nestia/core"),
  );
  return [
    {
      ...(typia ?? {}),
      transform: "typia/lib/transform",
      enabled: false,
    },
    normalizeRuntimePlugin({
      ...(core ?? {}),
      transform: "@nestia/core/native/transform.cjs",
    }),
  ];
};

const readProjectPlugins = async (cwd: string): Promise<RuntimePlugin[]> => {
  const project: string = normalizeProjectPath(process.env.NESTIA_PROJECT);
  const file: string = path.isAbsolute(project)
    ? project
    : path.join(cwd, project);
  const config = await TsConfigReader.read(file);
  const options = config.compilerOptions as
    | { plugins?: RuntimePlugin[] }
    | undefined;
  return Array.isArray(options?.plugins)
    ? options.plugins
        .filter((p) => typeof p === "object" && p !== null)
        .map((p) => ({ ...(p as unknown as RuntimePlugin) }))
    : [];
};

const normalizeRuntimePlugin = (plugin: RuntimePlugin): RuntimePlugin => {
  const output: RuntimePlugin = { ...plugin };
  if (output.enabled === false) delete output.enabled;
  return output;
};

const isTransform = (plugin: RuntimePlugin, name: string): boolean =>
  typeof plugin.transform === "string" && plugin.transform.includes(name);

const replaceExtension = (file: string, extension: string): string =>
  file.replace(/\.[cm]?tsx?$/i, (matched) =>
    matched.toLowerCase() === ".mts"
      ? ".mjs"
      : matched.toLowerCase() === ".cts"
        ? ".cjs"
        : extension,
  );

const normalizeProjectPath = (project: string | undefined): string => {
  const next: string = project ?? "tsconfig.json";
  return path.isAbsolute(next) || next.startsWith(".") ? next : `./${next}`;
};

const dynamicImport: (specifier: string) => Promise<any> = Function(
  "specifier",
  "return import(specifier);",
) as (specifier: string) => Promise<any>;
