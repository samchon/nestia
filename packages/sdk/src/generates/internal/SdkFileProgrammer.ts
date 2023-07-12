import fs from "fs";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { MapUtil } from "../../utils/MapUtil";
import { SdkFunctionProgrammer } from "./SdkFunctionProgrammer";
import { SdkRouteDirectory } from "./SdkRouteDirectory";

export namespace SdkFileProgrammer {
    /* ---------------------------------------------------------
        CONSTRUCTOR
    --------------------------------------------------------- */
    export const generate =
        (config: INestiaConfig) =>
        async (routeList: IRoute[]): Promise<void> => {
            // CONSTRUCT FOLDER TREE
            const root: SdkRouteDirectory = new SdkRouteDirectory(
                null,
                "functional",
            );
            for (const route of routeList) emplace(root)(route);

            // ITERATE FILES
            await iterate(config)(root)(config.output + "/functional");
        };

    const emplace =
        (directory: SdkRouteDirectory) =>
        (route: IRoute): void => {
            // OPEN DIRECTORIES
            for (const key of route.accessors.slice(0, -1)) {
                directory = MapUtil.take(
                    directory.children,
                    key,
                    () => new SdkRouteDirectory(directory, key),
                );
            }

            // ADD ROUTE
            directory.routes.push(route);
        };

    /* ---------------------------------------------------------
        FILE ITERATOR
    --------------------------------------------------------- */
    const iterate =
        (config: INestiaConfig) =>
        (directory: SdkRouteDirectory) =>
        async (outDir: string): Promise<void> => {
            // CREATE A NEW DIRECTORY
            try {
                await fs.promises.mkdir(outDir);
            } catch {}

            // ITERATE CHILDREN
            const content: string[] = [];
            for (const [key, value] of directory.children) {
                await iterate(config)(value)(`${outDir}/${key}`);
                content.push(`export * as ${key} from "./${key}";`);
            }
            if (content.length && directory.routes.length) content.push("");

            // ITERATE ROUTES
            const importDict: ImportDictionary = new ImportDictionary();
            if (
                config.simulate === true &&
                directory.routes.some((r) => !!r.parameters.length)
            )
                importDict.emplace(
                    `${config.output}/utils/NestiaSimulator.ts`,
                    true,
                    "NestiaSimulator",
                );

            directory.routes.forEach((route, i) => {
                for (const tuple of route.imports)
                    for (const instance of tuple[1])
                        importDict.emplace(tuple[0], false, instance);

                content.push(SdkFunctionProgrammer.generate(config)(route));
                if (i !== directory.routes.length - 1) content.push("");
            });

            // FINALIZE THE CONTENT
            if (directory.routes.length !== 0) {
                const primitived: boolean =
                    config.primitive !== false &&
                    directory.routes.some(
                        (route) =>
                            route.output.name !== "void" ||
                            route.parameters.some(
                                (param) => param.category !== "param",
                            ),
                    );
                const asserted: boolean =
                    config.assert === true &&
                    directory.routes.some(
                        (route) => route.parameters.length !== 0,
                    );
                const json: boolean =
                    config.json === true &&
                    directory.routes.some(
                        (route) =>
                            route.method === "POST" ||
                            route.method === "PUT" ||
                            route.method === "PATCH",
                    );
                const random: boolean =
                    config.simulate === true &&
                    directory.routes.some(
                        (s) =>
                            !!s.parameters.length || s.output.name !== "void",
                    );

                const classes: string[] = ["Fetcher"];
                const typings: string[] = ["IConnection"];
                if (primitived) typings.push("Primitive");

                const head: string[] = [
                    `import { ${classes.join(", ")} } from "@nestia/fetcher";`,
                    `import type { ${typings.join(
                        ", ",
                    )} } from "@nestia/fetcher";`,
                ];
                if (asserted || json || random)
                    head.push(`import typia from "typia";`);
                if (!importDict.empty())
                    head.push("", importDict.toScript(outDir));

                content.push(...head, "", ...content.splice(0, content.length));
            }

            const script: string =
                "/**\n" +
                " * @packageDocumentation\n" +
                ` * @module ${directory.module}\n` +
                " * @nestia Generated by Nestia - https://github.com/samchon/nestia \n" +
                " */\n" +
                "//================================================================\n" +
                content.join("\n");
            await fs.promises.writeFile(`${outDir}/index.ts`, script, "utf8");
        };
}
