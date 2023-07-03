import { IMigrateRoute } from "../structures/IMigrateMethod";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";

export namespace MethodProgrammer {
    export const write =
        (props: { path: string; method: string }) =>
        (route: ISwaggerRoute): IMigrateRoute => {
            return {
                name: "not-yet",
                namespace: "not-yet",
                value: route,
                ...props,
            };
        };
}
