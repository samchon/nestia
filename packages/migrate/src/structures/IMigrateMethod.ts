import { ISwaggerRoute } from "./ISwaggerRoute";

export interface IMigrateRoute {
    path: string;
    method: string;
    value: ISwaggerRoute;
}
