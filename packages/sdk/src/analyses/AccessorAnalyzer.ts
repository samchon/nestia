import { Escaper } from "typia/lib/utils/Escaper";

import { IRoute } from "../structures/IRoute";

export namespace AccessorAnalyzer {
    export const analyze = (routes: IRoute[]) => {
        shrink(routes);
        variable(routes);
        shrink(routes);
        for (const r of routes) r.name = r.accessors.at(-1) ?? r.name;
    };

    const prepare = (routeList: IRoute[]): Map<string, number> => {
        const dict: Map<string, number> = new Map();
        for (const route of routeList)
            route.accessors.forEach((_a, i) => {
                const key: string = route.accessors.slice(0, i + 1).join(".");
                dict.set(key, (dict.get(key) ?? 0) + 1);
            });
        return dict;
    };

    const variable = (routeList: IRoute[]) => {
        const dict: Map<string, number> = prepare(routeList);
        for (const route of routeList) {
            const emended: string[] = route.accessors.slice();
            route.accessors.forEach((accessor, i) => {
                if (Escaper.variable(accessor)) return;
                while (true) {
                    accessor = "$" + accessor;
                    const partial: string = [
                        ...route.accessors.slice(0, i),
                        accessor,
                    ].join(".");
                    if (dict.has(partial) === false) {
                        emended[i] = accessor;
                        break;
                    }
                }
            });
            route.accessors.splice(0, route.accessors.length, ...emended);
        }
    };

    const shrink = (routeList: IRoute[]) => {
        const dict: Map<string, number> = prepare(routeList);
        for (const route of routeList) {
            if (
                route.accessors.length < 2 ||
                route.accessors.at(-1) !== route.accessors.at(-2)
            )
                continue;

            const cut: string[] = route.accessors.slice(0, -1);
            if ((dict.get(cut.join(".")) ?? 0) > 1) continue;

            route.accessors = cut;
        }
    };
}
