/// <reference path="../typings/get-function-location.d.ts" />
import { INestApplication, VersioningType } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants";
import { NestContainer } from "@nestjs/core";
import { Module } from "@nestjs/core/injector/module";
import cp from "child_process";
import fs from "fs";
import getFunctionLocation from "get-function-location";
import os from "os";
import path from "path";
import { HashMap, Pair, Singleton } from "tstl";

import { INestiaConfig } from "../INestiaConfig";
import { SdkGenerator } from "../generates/SdkGenerator";
import { INestiaSdkInput } from "../structures/INestiaSdkInput";
import { ArrayUtil } from "../utils/ArrayUtil";
import { MapUtil } from "../utils/MapUtil";
import { SourceFinder } from "../utils/SourceFinder";

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
        const external: any[] = await import(runtime.output(file));
        for (const key in external) {
          const instance: Function = external[key];
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
              exclude: (app as any).config.globalPrefixOptions?.exclude ?? {},
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
    const outDir: string = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "nestia-runtime-"),
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
            plugins: [
              {
                transform: "typia/lib/transform",
                enabled: false,
              },
              {
                transform: "@nestia/sdk/lib/transform",
                enabled: false,
              },
              {
                transform: "@nestia/core/native/transform.cjs",
              },
            ],
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
      cp.execFileSync("npx", ["ttsc", "-p", project], {
        cwd,
        stdio: "pipe",
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

const replaceExtension = (file: string, extension: string): string =>
  file.replace(/\.[cm]?tsx?$/i, extension);

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
    location.endsWith(".ts") &&
    !location.endsWith(".d.ts") &&
    (config.output === undefined ||
      (location.indexOf(path.join(config.output, "functional")) === -1 &&
        (await (
          await bundler.get(config.output)
        )(location))) === false);

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
