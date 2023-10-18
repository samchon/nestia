import { INestApplication, VersioningType } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants";
import { NestContainer } from "@nestjs/core";
import { Module } from "@nestjs/core/injector/module";
import fs from "fs";
import path from "path";
import { HashMap, Pair, Singleton } from "tstl";

import { INestiaConfig } from "../INestiaConfig";
import { SdkGenerator } from "../generates/SdkGenerator";
import { INormalizedInput } from "../structures/INormalizedInput";
import { ArrayUtil } from "../utils/ArrayUtil";
import { MapUtil } from "../utils/MapUtil";
import { SourceFinder } from "../utils/SourceFinder";

export namespace ConfigAnalyzer {
    export const input = (config: INestiaConfig): Promise<INormalizedInput> =>
        MapUtil.take(memory, config, async () => {
            const input = config.input;
            if (Array.isArray(input)) return transform_input(config)(input);
            else if (typeof input === "function")
                return analyze_application(await input());
            else if (typeof input === "object")
                if (input === null)
                    throw new Error("Invalid input config. It can't be null.");
                else
                    return transform_input(config)(
                        input.include,
                        input.exclude,
                    );
            else if (typeof input === "string")
                return transform_input(config)([input]);
            else throw new Error("Invalid input config.");
        });

    const analyze_application = async (
        app: INestApplication,
    ): Promise<INormalizedInput> => {
        const files: HashMap<
            Pair<Function, string>,
            Set<string>
        > = new HashMap();
        const container: NestContainer = (app as any)
            .container as NestContainer;
        const modules: Module[] = [...container.getModules().values()].filter(
            (m) => !!m.controllers.size,
        );
        for (const m of modules) {
            const path: string =
                Reflect.getMetadata(
                    MODULE_PATH + container.getModules().applicationId,
                    m.metatype,
                ) ??
                Reflect.getMetadata(MODULE_PATH, m.metatype) ??
                "";
            for (const controller of [...m.controllers.keys()]) {
                const file: string | null =
                    (await require("get-function-location")(controller))
                        ?.source ?? null;
                if (file === null) continue;

                const location: string = normalize_file(file);
                if (location.length === 0) continue;

                const key: Pair<Function, string> = new Pair(
                    controller as Function,
                    location,
                );
                files.take(key, () => new Set([])).add(path);
            }
        }

        const versioning = (app as any).config?.versioningOptions;
        return {
            include: files.toJSON().map((pair) => ({
                controller: pair.first.first,
                file: pair.first.second,
                paths: [...pair.second.values()],
            })),
            globalPrefix:
                typeof (app as any).config?.globalPrefix === "string"
                    ? {
                          prefix: (app as any).config.globalPrefix,
                          exclude:
                              (app as any).config.globalPrefixOptions
                                  ?.exclude ?? {},
                      }
                    : undefined,
            versioning:
                versioning === undefined ||
                versioning.type !== VersioningType.URI
                    ? undefined
                    : {
                          prefix:
                              versioning.prefix === undefined ||
                              versioning.prefix === false
                                  ? "v"
                                  : versioning.prefix,
                          defaultVersion: versioning.defaultVersion,
                      },
        };
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

    const transform_input =
        (config: INestiaConfig) =>
        async (include: string[], exclude?: string[]) => ({
            include: (
                await SourceFinder.find({
                    include,
                    exclude,
                    filter: filter(config),
                })
            ).map((file) => ({
                paths: [""],
                file,
            })),
        });

    const filter =
        (config: INestiaConfig) =>
        async (location: string): Promise<boolean> =>
            location.endsWith(".ts") &&
            !location.endsWith(".d.ts") &&
            (config.output === undefined ||
                (location.indexOf(path.join(config.output, "functional")) ===
                    -1 &&
                    (await (
                        await bundler.get(config.output)
                    )(location))) === false);
}

const memory = new Map<INestiaConfig, Promise<INormalizedInput>>();
const bundler = new Singleton(async (output: string) => {
    const assets: string[] = await fs.promises.readdir(
        SdkGenerator.BUNDLE_PATH,
    );
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
            else if (it.second === true && file.indexOf(it.first) === 0)
                return true;
        return false;
    };
});
