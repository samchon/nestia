import { ISwaggerSchema } from "./ISwaggeSchema";

export interface IMigrateRoute {
    name: string;
    path: string;
    method: string;
    parameters: IMigrateRoute.IParameter[];
    headers: ISwaggerSchema | null;
    query: ISwaggerSchema | null;
    body: ISwaggerSchema | null;
    response: ISwaggerSchema | null;
    description?: string;
}
export namespace IMigrateRoute {
    export interface IParameter {
        key: string;
        schema: ISwaggerSchema;
        description?: string;
    }
}
