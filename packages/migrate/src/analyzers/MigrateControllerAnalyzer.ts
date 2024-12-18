import { IHttpMigrateRoute } from "@samchon/openapi";

import { IHttpMigrateController } from "../structures/IHttpMigrateController";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";

export namespace MigrateControllerAnalyzer {
  export const analyze = (props: {
    routes: IHttpMigrateRoute[];
  }): IHttpMigrateController[] => {
    const collection: Map<string, IHttpMigrateController> = new Map();
    for (const route of props.routes) {
      const name: string =
        route.operation()["x-samchon-controller"] ??
        (route.accessor.length <= 1
          ? "__App"
          : route.accessor.slice(0, -1).map(StringUtil.capitalize).join("")) +
          "Controller";
      MapUtil.take(collection)(name)(() => ({
        name,
        path: "@lazy",
        location: "@lazy",
        routes: [],
      })).routes.push(route);
    }

    const controllers: IHttpMigrateController[] = [...collection.values()];
    for (const col of controllers) {
      const splitPath = (r: IHttpMigrateRoute): string[] =>
        r.emendedPath.split("/");
      const splitLocation = (r: IHttpMigrateRoute): string[] =>
        splitPath(r).filter((s) => s[0] !== ":");

      const minPath: string[] = splitPath(col.routes[0]);
      const minLocation: string[] = splitLocation(col.routes[0]);
      for (const r of col.routes.slice(1)) {
        minPath.splice(getSplitIndex(minPath, splitPath(r)));
        minLocation.splice(getSplitIndex(minLocation, splitLocation(r)));
      }
      col.path = minPath.join("/");
      col.location = "src/controllers/" + minLocation.join("/");
    }
    return controllers;
  };
}

const getSplitIndex = (x: string[], y: string[]) => {
  const n: number = Math.min(x.length, y.length);
  for (let i: number = 0; i < n; ++i) if (x[i] !== y[i]) return i;
  return n;
};
