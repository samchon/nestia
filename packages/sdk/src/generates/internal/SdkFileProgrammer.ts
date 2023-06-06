import fs from "fs";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
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

            // RELOCATE FOR ONLY ONE CONTROLLER METHOD IN AN URL CASE
            relocate(root);

            // ITERATE FILES
            await iterate(config)(root)(config.output + "/functional");
        };

    const emplace =
        (directory: SdkRouteDirectory) =>
        (route: IRoute): void => {
            // SEPARATE IDENTIFIERS
            const identifiers: string[] = route.path
                .split("/")
                .filter((str) => str.length && str[0] !== ":")
                .map((str) => str.split("-").join("_").split(".").join("_"));

            // OPEN DIRECTORIES
            for (const key of identifiers) {
                directory = directory.directories.take(
                    key,
                    () => new SdkRouteDirectory(directory, key),
                );
            }

            // ADD ROUTE
            directory.routes.push(route);
        };

    const relocate = (directory: SdkRouteDirectory): void => {
        if (
            directory.parent !== null &&
            directory.directories.empty() &&
            directory.routes.length === 1 &&
            directory.name === directory.routes[0].name
        ) {
            directory.parent.routes.push(directory.routes[0]);
            directory.parent.directories.erase(directory.name);
        } else if (directory.directories.empty() === false)
            for (const it of directory.directories) relocate(it.second);
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
            for (const it of directory.directories) {
                await iterate(config)(it.second)(`${outDir}/${it.first}`);
                content.push(`export * as ${it.first} from "./${it.first}";`);
            }
            if (content.length && directory.routes.length) content.push("");

            // ITERATE ROUTES
            const importDict: ImportDictionary = new ImportDictionary();
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
                    config.random === true &&
                    directory.routes.some((s) => s.output.name !== "void");

                const typings: string[] = ["IConnection"];
                if (primitived) typings.push("Primitive");

                const head: string[] = [
                    `import { Fetcher } from "@nestia/fetcher";`,
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
