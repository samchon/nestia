import { IMigrateRoute } from "./IMigrateMethod";

export class RouteDirectory {
    public readonly module: string;
    public readonly children: Map<string, RouteDirectory>;
    public readonly routes: IMigrateRoute[];

    public constructor(
        parent: RouteDirectory | null,
        public readonly name: string,
    ) {
        this.module = parent ? `${parent.module}.${name}` : `api.${name}`;
        this.children = new Map();
        this.routes = [];
    }
}
