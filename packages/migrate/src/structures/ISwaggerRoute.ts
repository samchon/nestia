import { IJsDocTagInfo } from "typia/lib/schemas/metadata/IJsDocTagInfo";

import { ISwaggerSchema } from "./ISwaggeSchema";

export interface ISwaggerRoute {
    parameters?: ISwaggerRoute.IParameter[];
    requestBody?: ISwaggerRoute.IRequestBody;
    responses?: ISwaggerRoute.IResponseBody;
    summary?: string;
    description?: string;
    deprecated?: boolean;
    security?: Record<string, string[]>[];
    tags?: string[];
    "x-nestia-jsDocTags"?: IJsDocTagInfo[];
}
export namespace ISwaggerRoute {
    export interface IParameter {
        name?: string;
        in: "path" | "query" | "header" | "cookie";
        schema: ISwaggerSchema;
        required?: boolean;
        description?: string;
    }
    export interface IRequestBody {
        description?: string;
        content: IContent;
        required?: boolean;
        "x-nestia-encrypted"?: boolean;
    }
    export type IResponseBody = Record<
        string,
        {
            description?: string;
            content?: IContent;
            "x-nestia-encrypted"?: boolean;
        }
    >;
    export interface IContent {
        "text/plain"?: {
            schema: ISwaggerSchema;
        };
        "application/json"?: {
            schema: ISwaggerSchema;
        };
        "application/x-www-form-urlencoded"?: {
            schema: ISwaggerSchema;
        };
        "*/*"?: {
            schema: ISwaggerSchema;
        };
    }
}
