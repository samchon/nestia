import { INestApplication, VersioningType } from "@nestjs/common";
import fs from "fs";
import path from "path";
import { HashMap, HashSet, Pair, Singleton } from "tstl";

import { INestiaConfig } from "../INestiaConfig";
import { SdkGenerator } from "../generates/SdkGenerator";
import { INormalizedInput } from "../structures/INormalizedInput";
import { ArrayUtil } from "../utils/ArrayUtil";
import { MapUtil } from "../utils/MapUtil";
import { SourceFinder } from "../utils/SourceFinder";
import { PathAnalyzer } from "./PathAnalyzer";

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
        const visited: HashSet<Pair<string, Function>> = new HashSet();

        for (const module of (app as any).container.modules.values())
            for (const controller of module._controllers.keys())
                await analyze_controller(files)("")(controller);
        const routers: IRouterModule[] = [
            ...(app as any).container.dynamicModulesMetadata.values(),
        ].filter(is_router_module);
        for (const r of routers)
            for (const p of r.providers)
                for (const v of p.useValue)
                    await analyze_router(files, visited)("")(v);

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
                      },
        };
    };

    const analyze_controller =
        (files: HashMap<Pair<Function, string>, Set<string>>) =>
        (parent: string) =>
        async (controller: Function): Promise<void> => {
            const file: string | null =
                (await require("get-function-location")(controller))?.source ??
                null;
            if (file === null) return;

            const location: string = normalize_file(file);
            if (location.length === 0) return;

            const key: Pair<Function, string> = new Pair(controller, location);
            files.take(key, () => new Set([parent]));
        };

    const analyze_module =
        (
            files: HashMap<Pair<Function, string>, Set<string>>,
            visited: HashSet<Pair<string, Function>>,
        ) =>
        (parent: string) =>
        async (modulo: Function): Promise<void> => {
            const address: Pair<string, Function> = new Pair(parent, modulo);
            if (visited.has(address)) return;
            visited.insert(address);

            const controllers: Function[] =
                Reflect.getMetadata("controllers", modulo) ?? [];
            const imports: Function[] =
                Reflect.getMetadata("imports", modulo) ?? [];

            for (const c of controllers)
                await analyze_controller(files)(parent)(c);
            for (const i of imports)
                await analyze_module(files, visited)(parent)(i);
        };

    const analyze_router =
        (
            files: HashMap<Pair<Function, string>, Set<string>>,
            visited: HashSet<Pair<string, Function>>,
        ) =>
        (parent: string) =>
        async (value: IRouterModuleValue): Promise<void> => {
            if (value.module)
                await analyze_module(
                    files,
                    visited,
                )(PathAnalyzer.join(parent, value.path))(value.module);
            if (value.children?.length)
                for (const child of value.children)
                    await analyze_router(
                        files,
                        visited,
                    )(PathAnalyzer.join(parent, value.path))(child);
        };

    const is_router_module = (router: any): router is IRouterModule =>
        Array.isArray(router.providers) &&
        router.providers.every(
            (p: any) =>
                typeof p.provide === "symbol" &&
                Array.isArray(p.useValue) &&
                p.useValue.every(
                    (u: any) =>
                        typeof u.path === "string" &&
                        typeof u.module === "function",
                ),
        );

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

interface IRouterModule {
    providers: {
        provide: symbol;
        useValue: IRouterModuleValue[];
    }[];
}
interface IRouterModuleValue {
    path: string;
    module: Function;
    children?: IRouterModuleValue[];
}
