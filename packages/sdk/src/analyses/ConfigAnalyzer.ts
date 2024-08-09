/// <reference path="../typings/get-function-location.d.ts" />
import { DynamicModule } from "@nestia/core";
import { INestApplication, VersioningType } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants";
import { NestContainer, NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/core/injector/module";
import getFunctionLocation from "get-function-location";
import { HashMap } from "tstl";

import { INestiaConfig } from "../INestiaConfig";
import { INestiaSdkInput } from "../structures/INestiaSdkInput";
import { MapUtil } from "../utils/MapUtil";

export namespace ConfigAnalyzer {
  export const input = async (
    config: INestiaConfig,
  ): Promise<INestiaSdkInput> =>
    MapUtil.take(memory, config, async () => {
      const app: INestApplication =
        typeof config.input === "function"
          ? await config.input()
          : await NestFactory.create(await DynamicModule.mount(config.input), {
              logger: false,
            });
      return analyze_application(app);
    });

  const analyze_application = async (
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
      application: app,
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
