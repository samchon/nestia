import { IHttpMigrateRoute } from "@typia/interface";

import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { MapUtil } from "../utils/MapUtil";
import { PathTemplate } from "../utils/PathTemplate";
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
        splitPath(r)
          .filter((s) => s.length !== 0 && s[0] !== ":")
          .map(directoryName);

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
   * the literal `-id`, and the handler's lookup would miss. Each parameter is
   * found where the document's template writes it, beside literal text in its
   * segment too (`/files/{id}.json`).
   *
   * A literal character the router reserves is escaped, so an AIP custom
   * method's `/items:batchGet` stays a literal rather than a parameter
   * `batchGet`, and `(` or `*` no syntax error.
   */
  export const routePath = (route: IHttpMigrateRoute): string =>
    PathTemplate.segments(route)
      .map((segment) =>
        segment.type === "literal"
          ? segment.value.replace(ROUTER_RESERVED, "\\$&")
          : `:${segment.parameter.key}`,
      )
      .join("");
}

/**
 * The characters path-to-regexp 8, Express 5's router, gives a meaning in a
 * route: parameters, wildcards, optional groups, and its own escape.
 */
const ROUTER_RESERVED = /[\\:*?+!(){}[\]]/g;

/**
 * A route segment as a directory name: unescaped, and each character a file
 * name cannot hold on Windows (`:` of an AIP custom method, `*`, `?`) as `_`.
 */
const directoryName = (segment: string): string =>
  segment.replace(/\\(.)/g, "$1").replace(/[<>:"|?*\\]/g, "_");

const getSplitIndex = (x: string[], y: string[]) => {
  const n: number = Math.min(x.length, y.length);
  for (let i: number = 0; i < n; ++i) if (x[i] !== y[i]) return i;
  return n;
};
