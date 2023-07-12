import { Escaper } from "typia/lib/utils/Escaper";

import { IRoute } from "../structures/IRoute";

export namespace AccessorAnalyzer {
    export const analyze = (routes: IRoute[]) => {
        variable(routes);
        shrink(routes);
        for (const r of routes) r.name = r.accessors.at(-1) ?? r.name;
    };

    const prepare = (routeList: IRoute[]): Set<string> => {
        const dict: Set<string> = new Set();
        for (const route of routeList)
            route.accessors.forEach((_a, i) =>
                dict.add(route.accessors.slice(0, i + 1).join(".")),
            );
        return dict;
    };

    const variable = (routeList: IRoute[]) => {
        const dict: Set<string> = prepare(routeList);
        for (const route of routeList) {
            route.accessors.forEach((accessor, i) => {
                if (Escaper.variable(accessor)) return;
                while (true) {
                    accessor = "$" + accessor;
                    const partial: string = [
                        ...route.accessors.slice(0, i),
                        accessor,
                    ].join(".");
                    if (dict.has(partial) === false) {
                        route.accessors[i] = accessor;
                        break;
                    }
                }
            });
        }
    };

    const shrink = (routeList: IRoute[]) => {
        const dict: Set<string> = prepare(routeList);
        for (const route of routeList) {
            if (
                route.accessors.length < 2 ||
                route.accessors.at(-1) !== route.accessors.at(-2)
            )
                continue;

            const cut: string[] = route.accessors.slice(0, -1);
            if (dict.has(cut.join(".")) === true) continue;

            route.accessors = cut;
        }
    };
}
