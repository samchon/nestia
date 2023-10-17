import { INestApplication, VersioningType } from "@nestjs/common";

import { INestiaConfig } from "../INestiaConfig";

export namespace ConfigAnalyzer {
    export const input = async (
        config: INestiaConfig["input"],
    ): Promise<INestiaConfig.IInput> => {
        if (Array.isArray(config))
            return {
                include: config,
                exclude: [],
            };
        else if (typeof config === "function")
            return application(await config());
        else if (typeof config === "object")
            if (config === null) throw new Error("Invalid input config.");
            else return config as INestiaConfig.IInput;
        else if (typeof config === "string")
            return {
                include: [config],
                exclude: [],
            };
        else throw new Error("Invalid input config.");
    };

    const application = async (
        app: INestApplication,
    ): Promise<INestiaConfig.IInput> => {
        const cwd: string = process.cwd();
        const files: string[] = await (async () => {
            const functions = new Set<Function>();
            for (const module of (app as any).container.modules.values())
                for (const controller of module._controllers.keys())
                    functions.add(controller);
            const files: Set<string> = new Set();
            for (const f of functions)
                files.add(
                    (await require("get-function-location")(f))?.source ?? "",
                );
            return [...files]
                .map((str) =>
                    str.substring(
                        str.startsWith("file:///")
                            ? cwd[0] === "/"
                                ? 7
                                : 8
                            : str.startsWith("file://")
                            ? 7
                            : 0,
                    ),
                )
                .filter((str) => !!str.length);
        })();
        const versioning = (app as any).config?.versioningOptions;
        return {
            include: files,
            exclude: [],
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
}
