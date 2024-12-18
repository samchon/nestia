import { Escaper } from "typia/lib/utils/Escaper";

import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";

export namespace AccessorAnalyzer {
  export const analyze = (
    routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
  ) => {
    shrink(routes);
    variable(routes);
    shrink(routes);
    for (const r of routes) r.name = r.accessor.at(-1) ?? r.name;
  };

  const prepare = (
    routeList: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
  ): Map<string, number> => {
    const dict: Map<string, number> = new Map();
    for (const route of routeList)
      route.accessor.forEach((_a, i) => {
        const key: string = route.accessor.slice(0, i + 1).join(".");
        dict.set(key, (dict.get(key) ?? 0) + 1);
      });
    return dict;
  };

  const variable = (
    routeList: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
  ) => {
    const dict: Map<string, number> = prepare(routeList);
    for (const route of routeList) {
      const emended: string[] = route.accessor.slice();
      route.accessor.forEach((accessor, i) => {
        if (Escaper.variable(accessor)) return;
        while (true) {
          accessor = "$" + accessor;
          const partial: string = [
            ...route.accessor.slice(0, i),
            accessor,
          ].join(".");
          if (dict.has(partial) === false) {
            emended[i] = accessor;
            break;
          }
        }
      });
      route.accessor.splice(0, route.accessor.length, ...emended);
    }
  };

  const shrink = (routeList: Array<ITypedHttpRoute | ITypedWebSocketRoute>) => {
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
