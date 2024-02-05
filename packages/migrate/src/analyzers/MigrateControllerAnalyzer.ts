import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";
import { MigrateMethodAnalzyer } from "./MigrateMethodAnalyzer";

export namespace MigrateControllerAnalyzer {
  export const analyze = (
    props: IMigrateProgram.IProps,
  ): IMigrateController[] => {
    interface IEntry {
      endpoint: ISwaggerRoute;
      route: IMigrateRoute;
    }
    const endpoints: Map<string, IEntry[]> = new Map();

    // GATHER ROUTES
    for (const [path, collection] of Object.entries(props.swagger.paths)) {
      // PREPARE DIRECTORIES
      const location: string = StringUtil.splitWithNormalization(path)
        .filter((str) => str[0] !== "{" && str[0] !== ":")
        .join("/");
      for (const s of sequence(location)) MapUtil.take(endpoints)(s)(() => []);

      // INSERT ROUTES TO THE LAST DIRECTORY
      const routes: IEntry[] = MapUtil.take(endpoints)(location)(() => []);
      for (const [method, value] of Object.entries(collection)) {
        const r: IMigrateRoute | null = MigrateMethodAnalzyer.analyze(props)({
          path,
          method,
        })(value);
        if (r === null) continue;
        routes.push({
          endpoint: value,
          route: r,
        });
      }
    }

    // ABSORB STANDALONE ROUTES
    const emended: Map<string, IEntry[]> = new Map(
      [...endpoints.entries()].sort((a, b) => a[0].localeCompare(b[0])),
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
          routes.map((e) => e.route.path),
        );
        for (const e of routes)
          e.route.path = StringUtil.reJoinWithDecimalParameters(
            e.route.path.replace(prefix, ""),
          );
        const controller: IMigrateController = {
          name: StringUtil.pascal(location) + "Controller",
          path: StringUtil.reJoinWithDecimalParameters(prefix),
          location: "src/controllers/" + location,
          routes: routes.map((e) => e.route),
        };
        if (controller.name === "Controller") controller.name = "__Controller";
        emend(controller);

        for (const e of routes)
          props.dictionary.set(e.endpoint, {
            controller,
            route: e.route,
          });
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
    controller.routes.forEach((r, i) => {
      r.name = StringUtil.escapeDuplicate(
        controller.routes.filter((_r, j) => i !== j).map((x) => x.name),
      )(r.name);
    });
  };
}
