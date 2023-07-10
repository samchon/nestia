import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwagger } from "../structures/ISwagger";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";
import { RouteProgrammer } from "./RouteProgrammer";

export namespace ControllerProgrammer {
    export const analyze = (swagger: ISwagger): IMigrateController[] => {
        const dict: Map<string, IMigrateRoute[]> = new Map();

        // GATHER ROUTES
        for (const [path, collection] of Object.entries(swagger.paths)) {
            // PREPARE DIRECTORIES
            const location: string = StringUtil.split(path)
                .filter((str) => str[0] !== "{")
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
        StringUtil.split(location)
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
            const additional: string[] = StringUtil.split(route.path);
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

    export const write = (controller: IMigrateController): string => {
        const references: ISwaggerSchema.IReference[] = [];
        const body: string = [
            `@Controller(${JSON.stringify(controller.path)})`,
            `export class ${controller.name} {`,
            controller.routes
                .map((r) =>
                    RouteProgrammer.write(references)(r)
                        .split("\n")
                        .map((l) => `    ${l}`)
                        .join("\n"),
                )
                .join("\n\n"),
            `}`,
        ].join("\n");

        const core: boolean = controller.routes.some(
            (r) =>
                r.body !== null ||
                r.response === null ||
                r.response.type === "application/json",
        );
        const typia: boolean = controller.routes.some(
            (m) => m.response !== null,
        );
        const common: Set<string> = new Set(["Controller"]);
        for (const r of controller.routes)
            if (r.response?.type === "text/plain") {
                common.add("Header");
                common.add(StringUtil.capitalize(r.method));
            }

        const dtoImports: string[] = [
            ...new Set(
                references.map(
                    (r) =>
                        r.$ref
                            .replace("#/components/schemas/", "")
                            .split(".")[0],
                ),
            ),
        ].map(
            (ref) =>
                `import { ${ref} } from "${"../".repeat(
                    StringUtil.split(controller.location).length - 1,
                )}api/structures/${ref}"`,
        );

        return [
            ...(core ? [`import core from "@nestia/core";`] : []),
            `import { ${[...common].join(", ")} } from "@nestjs/common";`,
            ...(typia ? [`import typia from "typia";`] : []),
            "",
            ...(dtoImports.length ? [...dtoImports, ""] : []),
            body,
        ].join("\n");
    };
}
