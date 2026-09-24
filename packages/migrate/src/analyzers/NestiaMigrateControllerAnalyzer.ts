import { IHttpMigrateRoute } from "@typia/interface";

import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";

export namespace NestiaMigrateControllerAnalyzer {
  export const analyze = (
    routes: IHttpMigrateRoute[],
  ): INestiaMigrateController[] => {
    const collection: Map<string, INestiaMigrateController> = new Map();
    for (const r of routes) {
      const name: string =
        r.operation()["x-samchon-controller"] ??
        (r.accessor.length <= 1
          ? "__App"
          : r.accessor.slice(0, -1).map(StringUtil.capitalize).join("")) +
          "Controller";
      MapUtil.take(collection)(name)(() => ({
        name,
        path: "@lazy",
        location: "@lazy",
        routes: [],
      })).routes.push(r);
    }

    const controllers: INestiaMigrateController[] = [...collection.values()];
    for (const col of controllers) {
      const splitPath = (r: IHttpMigrateRoute): string[] =>
        routePath(r).split("/");
      const splitLocation = (r: IHttpMigrateRoute): string[] =>
        splitPath(r).filter((s) => s.length !== 0 && s[0] !== ":");

      const minPath: string[] = splitPath(col.routes[0]!);
      const minLocation: string[] = splitLocation(col.routes[0]!);
      for (const r of col.routes.slice(1)) {
        minPath.splice(getSplitIndex(minPath, splitPath(r)));
        minLocation.splice(getSplitIndex(minLocation, splitLocation(r)));
      }
      col.path = minPath.join("/");
      col.location = ["src", "controllers", ...minLocation].join("/");
    }
    return controllers;
  };

  /**
   * The route's path as NestJS reads it: each path parameter under the key its
   * handler reads with `@TypedParam()`. The document's name, such as `item-id`,
   * is no path-to-regexp parameter name; it would read as `item` followed by
   * the literal `-id`, and the handler's lookup would miss.
   */
  export const routePath = (route: IHttpMigrateRoute): string =>
    route.emendedPath
      .split("/")
      .map((segment) => {
        if (segment[0] !== ":") return segment;
        const parameter: IHttpMigrateRoute.IParameter | undefined =
          route.parameters.find((p) => p.name === segment.slice(1));
        return parameter !== undefined ? `:${parameter.key}` : segment;
      })
      .join("/");
}

const getSplitIndex = (x: string[], y: string[]) => {
  const n: number = Math.min(x.length, y.length);
  for (let i: number = 0; i < n; ++i) if (x[i] !== y[i]) return i;
  return n;
};
