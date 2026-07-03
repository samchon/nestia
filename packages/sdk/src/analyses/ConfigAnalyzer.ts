/// <reference path="../typings/get-function-location.d.ts" />
import { INestApplication, VersioningType } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants";
import { NestContainer } from "@nestjs/core";
import { Module } from "@nestjs/core/injector/module";
import fs from "fs";
import getFunctionLocation from "get-function-location";
import path from "path";
import { HashMap, Pair, Singleton } from "tstl";
import { pathToFileURL } from "url";

import { INestiaConfig } from "../INestiaConfig";
import { SdkGenerator } from "../generates/SdkGenerator";
import { INestiaSdkInput } from "../structures/INestiaSdkInput";
import { ArrayUtil } from "../utils/ArrayUtil";
import { EmittedJavaScriptPatcher } from "../utils/EmittedJavaScriptPatcher";
import { MapUtil } from "../utils/MapUtil";
import { SourceFinder } from "../utils/SourceFinder";
import { TsConfigReader } from "../utils/TsConfigReader";
import { TtscExecutor } from "../utils/TtscExecutor";

export namespace ConfigAnalyzer {
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
        filter: filter(config),
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
      const location: string = normalize_file(file);
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
              prefix:
                versioning.prefix === undefined || versioning.prefix === false
                  ? "v"
                  : versioning.prefix,
              defaultVersion: versioning.defaultVersion,
            },
    };
  };
}
const memory = new Map<INestiaConfig, Promise<INestiaSdkInput>>();
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
    await fs.promises.mkdir(runtimeRoot, { recursive: true });
    ensureRuntimeCleanup(runtimeRoot);
    const outDir: string = await fs.promises.mkdtemp(
      path.join(runtimeRoot, "run-"),
    );
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

const RUNTIME_ROOTS: Set<string> = new Set();
let RUNTIME_CLEANUP_REGISTERED: boolean = false;

const ensureRuntimeCleanup = (runtimeRoot: string): void => {
  RUNTIME_ROOTS.add(runtimeRoot);
  if (RUNTIME_CLEANUP_REGISTERED === true) return;
  RUNTIME_CLEANUP_REGISTERED = true;
  const sweep = (): void => {
    for (const location of RUNTIME_ROOTS)
      fs.rmSync(location, { force: true, recursive: true });
  };
  process.once("exit", sweep);
  // process.once("exit", …) does not fire on SIGINT/SIGTERM. Without these
  // handlers a Ctrl-C during codegen leaves `run-*` mkdtemp directories
  // behind under node_modules/.nestia/runtime/ until a subsequent clean exit.
  // The module-level RUNTIME_CLEANUP_REGISTERED flag above guards against
  // re-entrancy within this module; we deliberately do NOT gate on
  // `process.listenerCount(signal) > 0` because NestiaConfigLoader's parallel
  // sweep registers first, and that gate would skip our registration —
  // leaving RUNTIME_ROOTS unswept on Ctrl-C while config-loader cleans up.
  // Windows note: `process.kill(pid, "SIGINT")` calls TerminateProcess
  // rather than re-raising through the listener queue, so the handler
  // cascade documented above only holds on POSIX. On Windows, whichever
  // module registers FIRST runs its sweep and the second is skipped —
  // RUNTIME_ROOTS cleanup is best-effort there. SIGHUP is a no-op for
  // most common code paths on Windows (Node fires it on console-close
  // and exits within seconds).
  const onSignal = (signal: NodeJS.Signals): void => {
    sweep();
    process.kill(process.pid, signal);
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.once(signal, onSignal);
  }
};

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

const normalize_file = (str: string) =>
  str.substring(
    str.startsWith("file:///")
      ? process.cwd()[0] === "/"
        ? 7
        : 8
      : str.startsWith("file://")
        ? 7
        : 0,
  );

const filter =
  (config: INestiaConfig) =>
  async (location: string): Promise<boolean> =>
    SourceFinder.isTypeScriptSource(location) &&
    (config.output === undefined ||
      (location.indexOf(path.join(config.output, "functional")) === -1 &&
        (await (
          await bundler.get(config.output)
        )(location))) === false);

const dynamicImport: (specifier: string) => Promise<any> = Function(
  "specifier",
  "return import(specifier);",
) as (specifier: string) => Promise<any>;

const bundler = new Singleton(async (output: string) => {
  const assets: string[] = await fs.promises.readdir(SdkGenerator.BUNDLE_PATH);
  const tuples: Pair<string, boolean>[] = await ArrayUtil.asyncMap(
    assets,
    async (file) => {
      const relative: string = path.join(output, file);
      const location: string = path.join(SdkGenerator.BUNDLE_PATH, file);
      const stats: fs.Stats = await fs.promises.stat(location);
      return new Pair(relative, stats.isDirectory());
    },
  );
  return async (file: string): Promise<boolean> => {
    for (const it of tuples)
      if (it.second === false && file === it.first) return true;
      else if (it.second === true && file.indexOf(it.first) === 0) return true;
    return false;
  };
});
