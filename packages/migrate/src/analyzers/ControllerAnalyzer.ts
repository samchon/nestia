import { Escaper } from "typia/lib/utils/Escaper";

import { ISwagger } from "../module";
import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";
import { MethodAnalzyer } from "./MethodAnalyzer";

export namespace ControllerAnalyzer {
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
      const routes: IMigrateRoute[] = MapUtil.take(dict)(location)(() => []);
      for (const [method, value] of Object.entries(collection)) {
        const r: IMigrateRoute | null = MethodAnalzyer.analyze(swagger)({
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
        if (controller.name === "Controller") controller.name = "__Controller";
        emend(controller);
        return controller;
      });
  };

  const sequence = (location: string): string[] =>
    StringUtil.splitWithNormalization(location)
      .map((_str, i, entire) => entire.slice(0, i + 1).join("/"))
      .slice(0, -1)
      .reverse();

  const emend = (controller: IMigrateController): void => {
    interface IRouteCapsule {
      variables: string[];
      route: IMigrateRoute;
    }
    const dict: Map<string, IRouteCapsule[]> = new Map();
    for (const route of controller.routes) {
      const additional: string[] = StringUtil.splitWithNormalization(
        route.path,
      );
      const statics: string[] = additional.filter((str) => str[0] !== ":");
      if (statics.length) route.name = StringUtil.camel(statics.join("/"));
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
          : StringUtil.camel(`${emended}By/${c.variables.join("/and/")}`);
      }
    }
    for (const method of controller.routes) {
      if (Escaper.variable(method.name) === false)
        method.name = "_" + method.name;
      for (const spec of [method.headers, method.query, method.body])
        if (spec)
          spec.key = StringUtil.escapeDuplicate(
            method.parameters.map((p) => p.key),
          )(spec.key);
    }
    controller.routes.forEach(
      (r, i) =>
        (r.name = StringUtil.escapeDuplicate(
          controller.routes.filter((_r, j) => i !== j).map((x) => x.name),
        )(r.name)),
    );
  };
}
