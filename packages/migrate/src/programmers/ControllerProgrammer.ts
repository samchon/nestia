import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";
import { ImportProgrammer } from "./ImportProgrammer";
import { RouteProgrammer } from "./RouteProgrammer";

export namespace ControllerProgrammer {
    export const analyze = (swagger: ISwagger): IMigrateController[] => {
        const dict: Map<string, IMigrateRoute[]> = new Map();

        // GATHER ROUTES
        for (const [path, collection] of Object.entries(swagger.paths)) {
            // PREPARE DIRECTORIES
            const location: string = StringUtil.splitWithNormalization(path)
                .filter((str) => str[0] !== "{" && str[0] !== ":")
                .join("/");
            for (const s of sequence(location)) MapUtil.take(dict)(s)(() => []);

            // INSERT ROUTES TO THE LAST DIRECTORY
            const routes: IMigrateRoute[] = MapUtil.take(dict)(location)(
                () => [],
            );
            for (const [method, value] of Object.entries(collection)) {
                const r: IMigrateRoute | null = RouteProgrammer.analyze(
                    swagger,
                )({
                    path,
                    method,
                })(value);
                if (r !== null) routes.push(r);
            }
        }

        // ABSORB STANDALONE ROUTES
        const emended: Map<string, IMigrateRoute[]> = new Map(
            [...dict.entries()].sort((a, b) => a[0].localeCompare(b[0])),
        );
        for (const [location, routes] of emended) {
            if (routes.length !== 1) continue;
            for (const s of sequence(location).slice(0, 1)) {
                const parent = emended.get(s);
                if (parent) {
                    parent.push(...routes);
                    emended.delete(location);
                    break;
                }
            }
        }

        // GENERATE CONTROLLERS
        return [...emended.entries()]
            .filter(([_l, routes]) => !!routes.length)
            .map(([location, routes]) => {
                const prefix: string = StringUtil.commonPrefix(
                    routes.map((r) => r.path),
                );
                for (const r of routes)
                    r.path = StringUtil.reJoinWithDecimalParameters(
                        r.path.replace(prefix, ""),
                    );
                const controller: IMigrateController = {
                    name: StringUtil.pascal(location) + "Controller",
                    path: StringUtil.reJoinWithDecimalParameters(prefix),
                    location: "src/controllers/" + location,
                    routes,
                };
                naming(controller);
                return controller;
            });
    };

    const sequence = (location: string): string[] =>
        StringUtil.splitWithNormalization(location)
            .map((_str, i, entire) => entire.slice(0, i + 1).join("/"))
            .slice(0, -1)
            .reverse();

    const naming = (controller: IMigrateController): void => {
        interface IRouteCapsule {
            variables: string[];
            route: IMigrateRoute;
        }
        const dict: Map<string, IRouteCapsule[]> = new Map();
        for (const route of controller.routes) {
            const additional: string[] = StringUtil.splitWithNormalization(
                route.path,
            );
            const statics: string[] = additional.filter(
                (str) => str[0] !== ":",
            );
            if (statics.length)
                route.name = StringUtil.camel(statics.join("/"));
            else
                MapUtil.take(dict)(route.method)(() => []).push({
                    variables: additional
                        .filter((str) => str[0] === ":")
                        .map((str) => str.substring(1)),
                    route,
                });
        }

        for (const [method, capsules] of dict) {
            const emended: string = method === "delete" ? "erase" : method;
            for (const c of capsules) {
                const empty: boolean = c.variables.length === 0;
                c.route.name = empty
                    ? emended
                    : StringUtil.camel(
                          `${emended}By/${c.variables.join("/and/")}`,
                      );
            }
        }
    };

    export const write =
        (components: ISwaggerComponents) =>
        (controller: IMigrateController): string => {
            const importer: ImportProgrammer = new ImportProgrammer(null);
            const references: ISwaggerSchema.IReference[] = [];
            const body: string = [
                `@${importer.external({
                    library: "@nestjs/common",
                    instance: "Controller",
                })}(${JSON.stringify(controller.path)})`,
                `export class ${controller.name} {`,
                controller.routes
                    .map((r) =>
                        RouteProgrammer.write(components)(references)(importer)(
                            r,
                        )
                            .split("\n")
                            .map((l) => `    ${l}`)
                            .join("\n"),
                    )
                    .join("\n\n"),
                `}`,
            ].join("\n");
            return [
                ...importer.toScript(
                    (ref) =>
                        `${"../".repeat(
                            StringUtil.splitWithNormalization(
                                controller.location,
                            ).length - 1,
                        )}api/structures/${ref}`,
                ),
                ...(importer.empty() ? [] : [""]),
                body,
            ].join("\n");
        };
}
