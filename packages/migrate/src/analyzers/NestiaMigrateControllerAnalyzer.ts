import { IHttpMigrateRoute } from "@samchon/openapi";

import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";

/**
 * Namespace containing functions for analyzing and organizing routes into controllers.
 * 
 * This analyzer processes HTTP routes from OpenAPI specifications and groups them
 * into logical NestJS controller structures based on their paths and operations.
 * 
 * @author Samchon
 */
export namespace NestiaMigrateControllerAnalyzer {
  /**
   * Analyzes HTTP routes and groups them into controller structures.
   * 
   * Takes an array of HTTP routes and organizes them into logical controller
   * groupings based on their access patterns, paths, and custom controller
   * annotations. Each controller gets a name, base path, file location, and
   * collection of associated routes.
   * 
   * @param routes - Array of HTTP routes to analyze and group
   * @returns Array of controller structures with organized routes
   * 
   * @example
   * ```typescript
   * const routes = [
   *   { accessor: ["users", "create"], method: "POST", path: "/users" },
   *   { accessor: ["users", "findAll"], method: "GET", path: "/users" },
   *   { accessor: ["posts", "create"], method: "POST", path: "/posts" }
   * ];
   * 
   * const controllers = NestiaMigrateControllerAnalyzer.analyze(routes);
   * // Returns controllers like UsersController and PostsController
   * ```
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
        r.emendedPath.split("/");
      const splitLocation = (r: IHttpMigrateRoute): string[] =>
        splitPath(r).filter((s) => s.length !== 0 && s[0] !== ":");

      const minPath: string[] = splitPath(col.routes[0]);
      const minLocation: string[] = splitLocation(col.routes[0]);
      for (const r of col.routes.slice(1)) {
        minPath.splice(getSplitIndex(minPath, splitPath(r)));
        minLocation.splice(getSplitIndex(minLocation, splitLocation(r)));
      }
      col.path = minPath.join("/");
      col.location = ["src", "controllers", ...minLocation].join("/");
    }
    return controllers;
  };
}

/**
 * Finds the index where two string arrays start to differ.
 * 
 * Compares two string arrays element by element and returns the index
 * of the first differing element. Used for finding common path prefixes.
 * 
 * @param x - First string array
 * @param y - Second string array  
 * @returns Index where arrays differ, or the length of the shorter array
 * @internal
 */
const getSplitIndex = (x: string[], y: string[]) => {
  const n: number = Math.min(x.length, y.length);
  for (let i: number = 0; i < n; ++i) if (x[i] !== y[i]) return i;
  return n;
};
