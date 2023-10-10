import { IJsDocTagInfo } from "typia/lib/schemas/metadata/IJsDocTagInfo";

import { ISwaggerSchema } from "./ISwaggeSchema";

export interface IMigrateRoute {
    name: string;
    path: string;
    method: string;
    parameters: IMigrateRoute.IParameter[];
    headers: ISwaggerSchema | null;
    query: ISwaggerSchema | null;
    body: IMigrateRoute.IBody | null;
    success: IMigrateRoute.IBody | null;
    exceptions: Record<string, IMigrateRoute.IException>;
    description?: string;
    "x-nestia-jsDocTags"?: IJsDocTagInfo[];
}
export namespace IMigrateRoute {
    export interface IParameter {
        key: string;
        schema: ISwaggerSchema;
        description?: string;
    }
    export interface IBody {
        type:
            | "text/plain"
            | "application/json"
            | "application/x-www-form-urlencoded";
        schema: ISwaggerSchema;
        "x-nestia-encrypted"?: boolean;
    }
    export interface IException {
        description?: string;
        schema: ISwaggerSchema;
    }
}
