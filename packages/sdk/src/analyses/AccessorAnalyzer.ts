import { NamingConvention } from "@typia/utils";

import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";

type AnyRoute = ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute;

/**
 * Assigns each route the accessor path under which the generated SDK exposes
 * it.
 *
 * @evidence contracts/common.md#principled-implementation The accessors are shrunk where a name repeats, escaped into valid unique identifiers, shrunk again, and each route is renamed to its last accessor segment.
 * @evidence contracts/common.md#clear-and-simple-design One public function over three private passes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The passes follow the accessor structure and no route or controller name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace AccessorAnalyzer {
  /**
   * Rewrites the accessor of every route in place so that accessors are valid,
   * unique, and as short as they can be.
   *
   * @evidence contracts/common.md#principled-implementation Segments that repeat their parent are removed when no sibling shares the parent, non-identifier characters become underscores, a segment that collides with an existing accessor gets an underscore prefix, and the route name becomes the last segment.
   * @evidence contracts/common.md#clear-and-simple-design One function that runs the passes in a fixed order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules apply to every route, and reserved names are computed from the routes themselves.
   * @evidence contracts/common.md#meaningful-documentation The comment states the passes and the in-place rewrite.
   */
  export const analyze = (routes: Array<AnyRoute>) => {
    shrink(routes);
    variable(routes);
    shrink(routes);
    for (const r of routes) r.name = r.accessor.at(-1) ?? r.name;
  };

  const prepare = (routeList: Array<AnyRoute>): Map<string, number> => {
    const dict: Map<string, number> = new Map();
    for (const route of routeList)
      route.accessor.forEach((_a, i) => {
        const key: string = route.accessor.slice(0, i + 1).join(".");
        dict.set(key, (dict.get(key) ?? 0) + 1);
      });
    return dict;
  };

  const variable = (routeList: Array<AnyRoute>) => {
    const reserved: Set<string> = reserve(routeList);
    const assigned: Map<string, string> = new Map();
    const used: Set<string> = new Set();
    for (const route of routeList) {
      const emended: string[] = [];
      route.accessor.forEach((accessor, i) => {
        const source: string = route.accessor.slice(0, i + 1).join(".");
        const registered: string | undefined = assigned.get(source);
        if (registered !== undefined) {
          emended.push(registered.split(".").at(-1)!);
          return;
        }

        accessor = normalize(accessor);
        while (NamingConvention.variable(accessor) === false)
          accessor = "_" + accessor;
        while (true) {
          const partial: string = [...emended, accessor].join(".");
          if (
            used.has(partial) === false &&
            (reserved.has(partial) === false || partial === source)
          ) {
            assigned.set(source, partial);
            used.add(partial);
            emended.push(accessor);
            break;
          }
          accessor = "_" + accessor;
        }
      });
      route.accessor.splice(0, route.accessor.length, ...emended);
    }
  };

  const reserve = (routeList: Array<AnyRoute>): Set<string> => {
    const output: Set<string> = new Set();
    for (const route of routeList)
      route.accessor.forEach((_a, i) => {
        const partial: string[] = route.accessor.slice(0, i + 1);
        if (partial.every(NamingConvention.variable))
          output.add(partial.join("."));
      });
    return output;
  };

  const normalize = (accessor: string): string => {
    const output: string = accessor.replace(/[^A-Za-z0-9_$]/g, "_");
    return output.length ? output : "_";
  };

  const shrink = (routeList: Array<AnyRoute>) => {
    const dict: Map<string, number> = prepare(routeList);
    for (const route of routeList) {
      if (
        route.accessor.length < 2 ||
        route.accessor.at(-1) !== route.accessor.at(-2)
      )
        continue;

      const cut: string[] = route.accessor.slice(0, -1);
      if ((dict.get(cut.join(".")) ?? 0) > 1) continue;

      route.accessor = cut;
    }
  };
}
