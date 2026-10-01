import { IHttpMigrateRoute } from "@typia/interface";

import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { MapUtil } from "../utils/MapUtil";
import { PathTemplate } from "../utils/PathTemplate";
import { StringUtil } from "../utils/StringUtil";

/**
 * Groups the routes of an application into NestJS controllers.
 *
 * @evidence contracts/common.md#principled-implementation Routes are grouped by the controller name from the operation, or by the capitalized accessor prefix, and each controller path is the longest path prefix shared by all of its routes, so one controller covers one resource path.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with the grouping and the path formatting, and small private helpers for the shared-prefix computation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names and paths derive from the document, with no route or controller name special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace NestiaMigrateControllerAnalyzer {
  /**
   * Returns the controllers of the routes, each with its name, its path, its
   * source location, and its routes.
   *
   * The name is the `x-samchon-controller` extension of the operation when
   * present, and otherwise the capitalized accessor prefix followed by
   * `Controller`.
   *
   * @evidence contracts/common.md#principled-implementation Grouping uses a map keyed by controller name, and the common path prefix and the directory prefix are found by removing every segment after the first difference across the routes, so a controller path is a prefix of every route it owns.
   * @evidence contracts/common.md#clear-and-simple-design One function with two phases: grouping, then prefix computation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The extension name is part of the generated document contract; no other name is assumed.
   * @evidence contracts/common.md#meaningful-documentation The comment states how the name and the path are chosen.
   */
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
   *
   * @evidence contracts/common.md#principled-implementation The path template is split into literal and parameter segments, and every character that path-to-regexp treats specially in a literal is escaped with a backslash, so a literal never changes the route's meaning.
   * @evidence contracts/common.md#clear-and-simple-design One expression over the shared path segmenter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reserved set is the router's syntax and is applied to every literal.
   * @evidence contracts/common.md#meaningful-documentation The comment states the escaping and the parameter form.
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
